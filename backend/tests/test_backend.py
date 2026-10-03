import os
import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.users import User, Role
from app.utils.security import hash_password, create_access_token
from app.services.metadata_service import MetadataService
from app.models.findings import Finding, FindingSeverity, ReviewStatus

TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create test user
    test_user = User(
        email="test.investigator@sentinel.local",
        hashed_password=hash_password("Secret123!"),
        full_name="Alex Mercer",
        role=Role.INVESTIGATOR,
        is_active=True
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    db.close()
    
    yield
    
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def auth_headers():
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "test.investigator@sentinel.local").first()
    token = create_access_token(subject=user.id)
    db.close()
    return {"Authorization": f"Bearer {token}"}

client = TestClient(app)

def test_system_status():
    response = client.get("/api/system/status")
    assert response.status_code == 200
    data = response.json()
    assert data["database"]["status"] == "OPERATIONAL"
    assert data["ai_provider"]["status"] == "OPERATIONAL"

def test_login_success():
    response = client.post(
        "/api/auth/login",
        json={"email": "test.investigator@sentinel.local", "password": "Secret123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test.investigator@sentinel.local"

def test_login_failure():
    response = client.post(
        "/api/auth/login",
        json={"email": "test.investigator@sentinel.local", "password": "WrongPassword"}
    )
    assert response.status_code == 401

def test_authorization_protection():
    # Attempting to access protected endpoints without token must return 401
    resp = client.get("/api/investigations")
    assert resp.status_code == 401

    resp = client.get("/api/audit")
    assert resp.status_code == 401

def test_create_and_list_investigation(auth_headers):
    create_resp = client.post(
        "/api/investigations",
        headers=auth_headers,
        json={
            "title": "Operation Nightshade",
            "description": "Test inquiry into asset diversion",
            "priority": "HIGH"
        }
    )
    assert create_resp.status_code == 201
    created_data = create_resp.json()
    inv_id = created_data["id"]
    assert created_data["case_number"].startswith("SF-2026-")

    list_resp = client.get("/api/investigations", headers=auth_headers)
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert any(i["id"] == inv_id for i in items)

def test_sha256_calculation(tmp_path):
    test_file = tmp_path / "forensic_sample.txt"
    test_file.write_text("Integrity validation string 2026")
    sha256 = MetadataService.calculate_sha256(str(test_file))
    assert len(sha256) == 64
    assert isinstance(sha256, str)

def test_evidence_creation_and_pipeline(auth_headers):
    invs = client.get("/api/investigations", headers=auth_headers).json()
    inv_id = invs[0]["id"]

    sample_content = b"Wire transfer of $500,000 to offshore shell entity Viktor Kozlov in Zurich."
    files = [("files", ("transaction_memo.txt", io.BytesIO(sample_content), "text/plain"))]

    upload_resp = client.post(
        f"/api/investigations/{inv_id}/evidence",
        headers=auth_headers,
        files=files
    )
    assert upload_resp.status_code == 201
    uploaded_items = upload_resp.json()
    assert len(uploaded_items) == 1
    ev_item = uploaded_items[0]

    assert ev_item["original_filename"] == "transaction_memo.txt"
    assert len(ev_item["sha256_hash"]) == 64
    assert ev_item["status"] == "ANALYZED"
    assert ev_item["processing_stage"] == "COMPLETE"

    # Verify evidence detail endpoint
    ev_detail = client.get(f"/api/evidence/{ev_item['id']}", headers=auth_headers).json()
    assert ev_detail["id"] == ev_item["id"]
    assert ev_detail["metadata_record"] is not None
    assert "Viktor Kozlov" in ev_detail["metadata_record"]["extracted_text"]

def test_finding_and_review_workflow(auth_headers):
    invs = client.get("/api/investigations", headers=auth_headers).json()
    inv_id = invs[0]["id"]

    # Retrieve auto-generated findings from pipeline
    findings = client.get(f"/api/investigations/{inv_id}/findings", headers=auth_headers).json()
    assert len(findings) > 0
    target_finding = findings[0]

    # Review and confirm finding
    review_resp = client.patch(
        f"/api/findings/{target_finding['id']}/review",
        headers=auth_headers,
        json={
            "review_status": "CONFIRMED",
            "review_notes": "Corroborated by bank ledger records."
        }
    )
    assert review_resp.status_code == 200
    updated_finding = review_resp.json()
    assert updated_finding["review_status"] == "CONFIRMED"
    assert updated_finding["reviewed_by_id"] is not None
    assert updated_finding["review_notes"] == "Corroborated by bank ledger records."

def test_intelligence_graph_and_risk(auth_headers):
    invs = client.get("/api/investigations", headers=auth_headers).json()
    inv_id = invs[0]["id"]

    ent_resp = client.post(
        f"/api/investigations/{inv_id}/entities",
        headers=auth_headers,
        json={"name": "Suspect X", "category": "PERSON", "risk_score": 75}
    )
    assert ent_resp.status_code == 201

    graph_resp = client.get(f"/api/investigations/{inv_id}/graph", headers=auth_headers)
    assert graph_resp.status_code == 200
    graph_data = graph_resp.json()
    assert len(graph_data["nodes"]) >= 1

    risk_resp = client.get(f"/api/investigations/{inv_id}/risk", headers=auth_headers)
    assert risk_resp.status_code == 200
    risk_data = risk_resp.json()
    assert "overall_score" in risk_data
    assert len(risk_data["factors"]) > 0

def test_report_generation(auth_headers):
    invs = client.get("/api/investigations", headers=auth_headers).json()
    inv_id = invs[0]["id"]

    # Generate JSON report
    json_rep_resp = client.post(
        f"/api/investigations/{inv_id}/reports",
        headers=auth_headers,
        json={"format": "JSON", "title": "Test JSON Dossier"}
    )
    assert json_rep_resp.status_code == 201
    json_report = json_rep_resp.json()
    assert json_report["format"] == "JSON"

    # Generate PDF report
    pdf_rep_resp = client.post(
        f"/api/investigations/{inv_id}/reports",
        headers=auth_headers,
        json={"format": "PDF", "title": "Test PDF Dossier"}
    )
    assert pdf_rep_resp.status_code == 201
    pdf_report = pdf_rep_resp.json()
    assert pdf_report["format"] == "PDF"

    # Verify download endpoint
    dl_resp = client.get(f"/api/reports/{pdf_report['id']}/download", headers=auth_headers)
    assert dl_resp.status_code == 200
    assert dl_resp.headers["content-type"] == "application/pdf"
    assert len(dl_resp.content) > 100

def test_audit_logging(auth_headers):
    audit_resp = client.get("/api/audit", headers=auth_headers)
    assert audit_resp.status_code == 200
    logs = audit_resp.json()
    assert len(logs) > 0
    # Confirm actions exist for uploads, reviews, and reports
    actions = [l["action"] for l in logs]
    assert any("EVIDENCE_UPLOAD" in a for a in actions)
    assert any("REPORT_GENERATE" in a for a in actions)

def test_dynamic_sha256_differentiation(auth_headers):
    import hashlib
    invs = client.get("/api/investigations", headers=auth_headers).json()
    inv_id = invs[0]["id"]

    content_a = b"Payload Alpha Forensics 1001"
    content_b = b"Payload Beta Countermeasures 2002"
    expected_hash_a = hashlib.sha256(content_a).hexdigest()
    expected_hash_b = hashlib.sha256(content_b).hexdigest()

    assert expected_hash_a != expected_hash_b

    files_a = [("files", ("artifact_alpha.txt", io.BytesIO(content_a), "text/plain"))]
    files_b = [("files", ("artifact_beta.txt", io.BytesIO(content_b), "text/plain"))]

    resp_a = client.post(f"/api/investigations/{inv_id}/evidence", headers=auth_headers, files=files_a)
    resp_b = client.post(f"/api/investigations/{inv_id}/evidence", headers=auth_headers, files=files_b)

    assert resp_a.status_code == 201
    assert resp_b.status_code == 201

    item_a = resp_a.json()[0]
    item_b = resp_b.json()[0]

    assert item_a["sha256_hash"] == expected_hash_a
    assert item_b["sha256_hash"] == expected_hash_b
    assert item_a["sha256_hash"] != item_b["sha256_hash"]

def test_fresh_report_reflects_finding_review_state(auth_headers):
    invs = client.get("/api/investigations", headers=auth_headers).json()
    inv_id = invs[0]["id"]

    findings = client.get(f"/api/investigations/{inv_id}/findings", headers=auth_headers).json()
    assert len(findings) > 0
    target_finding = findings[0]

    # Confirm finding with explicit notes
    verification_note = "Confirmed via corroborating bank transaction log 9842"
    review_resp = client.patch(
        f"/api/findings/{target_finding['id']}/review",
        headers=auth_headers,
        json={"review_status": "CONFIRMED", "review_notes": verification_note}
    )
    assert review_resp.status_code == 200

    # Generate fresh JSON report
    rep_resp = client.post(
        f"/api/investigations/{inv_id}/reports",
        headers=auth_headers,
        json={"format": "JSON", "title": "Updated Dossier Check"}
    )
    assert rep_resp.status_code == 201
    rep_meta = rep_resp.json()

    # Download report and verify updated state is present
    dl_resp = client.get(f"/api/reports/{rep_meta['id']}/download", headers=auth_headers)
    assert dl_resp.status_code == 200
    import json
    report_data = json.loads(dl_resp.content.decode("utf-8"))

    matching = [f for f in report_data["findings"] if f["id"] == target_finding["id"]]
    assert len(matching) == 1
    assert matching[0]["review_status"] == "CONFIRMED"
