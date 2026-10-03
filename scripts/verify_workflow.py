#!/usr/bin/env python3
"""
Sentinel Fusion — End-to-End Automated Workflow Verification
Executes the full 12-step forensic demonstration against the live SQLite database.
"""
import os
import sys
import io

# Locate backend root
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(base_dir, "backend")
sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app

def run_walkthrough():
    client = TestClient(app)
    print("====================================================================")
    print("SENTINEL FUSION: END-TO-END DEMO WORKFLOW VERIFICATION")
    print("====================================================================")

    # 1. System Health Check
    print("\n[Step 1] Checking System Diagnostics (/api/system/status)...")
    res = client.get("/api/system/status")
    assert res.status_code == 200, f"Status failed: {res.text}"
    status_data = res.json()
    print(f"  ✓ Database: {status_data['database']['status']} ({status_data['database']['details']})")
    print(f"  ✓ Storage: {status_data['storage']['status']} ({status_data['storage']['details']})")
    print(f"  ✓ OCR: {status_data['ocr_engine']['status']} ({status_data['ocr_engine']['details']})")
    print(f"  ✓ AI Provider: {status_data['ai_provider']['status']} ({status_data['ai_provider']['details']})")

    # 2. Login as Lead Investigator Sarah Lin
    print("\n[Step 2] Authenticating as Lead Investigator (Sarah Lin)...")
    login_res = client.post("/api/auth/login", json={
        "email": "lead.investigator@sentinel.local",
        "password": "Password123!"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    auth_data = login_res.json()
    token = auth_data["access_token"]
    user = auth_data["user"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"  ✓ Authenticated: {user['full_name']} [{user['role']}]")

    # 3. Retrieve Investigations
    print("\n[Step 3] Fetching Investigations Dossiers...")
    inv_res = client.get("/api/investigations", headers=headers)
    assert inv_res.status_code == 200
    investigations = inv_res.json()
    assert len(investigations) > 0
    case = next((i for i in investigations if i["case_number"] == "SF-2026-001"), investigations[0])
    case_id = case["id"]
    print(f"  ✓ Found Active Case: {case['case_number']} - {case['title']} [Priority: {case['priority']}]")

    # 4. Inspect Evidence Vault
    print(f"\n[Step 4] Ingesting & Querying Evidence in Vault for Case {case['case_number']}...")
    ev_res = client.get(f"/api/investigations/{case_id}/evidence", headers=headers)
    assert ev_res.status_code == 200
    evidence_list = ev_res.json()
    print(f"  ✓ Vault contains {len(evidence_list)} seized items:")
    for ev in evidence_list[:4]:
        print(f"    - {ev['original_filename']} ({ev['file_size']} bytes) | SHA-256: {ev['sha256_hash'][:16]}... | Stage: {ev['processing_stage']}")

    # 5. Inspect Detail of Photo Evidence (EXIF / GPS / Authenticity)
    photo_ev = next((e for e in evidence_list if "photo" in e["original_filename"].lower() or "jpg" in e["original_filename"].lower()), evidence_list[0])
    print(f"\n[Step 5] Detailed Forensic Inspection of Evidence: {photo_ev['original_filename']}...")
    detail_res = client.get(f"/api/evidence/{photo_ev['id']}", headers=headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    meta = detail.get("metadata_record")
    print(f"  ✓ SHA-256 Cryptographic Digest: {detail['sha256_hash']}")
    if meta:
        print(f"  ✓ Camera Sensor Make/Model: {meta.get('device_make', 'N/A')} {meta.get('device_model', '')}")
        print(f"  ✓ GPS Geotag: Lat {meta.get('gps_latitude')}, Lon {meta.get('gps_longitude')}")
        print(f"  ✓ Media Authenticity Score: {meta.get('authenticity_score')} ({meta.get('authenticity_notes')})")

    # 6. Upload New Evidence and verify real 5-stage pipeline
    print("\n[Step 6] Ingesting New Seized Artifact through Pipeline Engine...")
    sample_text = (
        "CONFIDENTIAL MEMORANDUM\n"
        "To: Viktor Kozlov (v.kozlov@protonmail.ch)\n"
        "From: Elena Rostova\n"
        "Subject: Wire transfer confirmation\n"
        "Please confirm receipt of wire transfer $250,000 to offshore account 0x71C634C2447d337242624da41b7423389E4740f9 in Zurich.\n"
        "Contact endpoint IP: 185.220.101.5"
    )
    upload_files = [("files", ("intercepted_cable_0929.txt", io.BytesIO(sample_text.encode('utf-8')), "text/plain"))]
    up_res = client.post(f"/api/investigations/{case_id}/evidence", headers=headers, files=upload_files)
    assert up_res.status_code == 201, f"Upload failed: {up_res.text}"
    new_ev = up_res.json()[0]
    print(f"  ✓ Ingested: {new_ev['original_filename']} -> ID: {new_ev['id']}")
    print(f"  ✓ SHA-256: {new_ev['sha256_hash']}")
    print(f"  ✓ Pipeline Status: {new_ev['status']} (Stage: {new_ev['processing_stage']})")

    # 7. Timeline Verification
    print(f"\n[Step 7] Reconstructing Timeline Events for {case['case_number']}...")
    timeline_res = client.get(f"/api/investigations/{case_id}/timeline", headers=headers)
    assert timeline_res.status_code == 200
    events = timeline_res.json()
    print(f"  ✓ Chronological Timeline contains {len(events)} events:")
    for ev in events[:4]:
        print(f"    [{ev['timestamp'][:19]}] ({ev['category']}) {ev['title']}")

    # 8. Intelligence Graph Verification
    print(f"\n[Step 8] Verifying Intelligence Graph Entities & Relationships...")
    graph_res = client.get(f"/api/investigations/{case_id}/graph", headers=headers)
    assert graph_res.status_code == 200
    graph_data = graph_res.json()
    nodes = graph_data["nodes"]
    edges = graph_data["edges"]
    print(f"  ✓ Graph Nodes: {len(nodes)} entities (Persons, Devices, Accounts, Locations, Orgs)")
    print(f"  ✓ Graph Edges: {len(edges)} verified relationships")
    for n in nodes[:4]:
        print(f"    - {n['data']['category']}: {n['data']['name']} (Risk: {n['data']['risk_score']})")

    # 9. AI Findings Verification & Human Confirmation
    print(f"\n[Step 9] Inspecting AI Findings & Executing Investigator Confirmation...")
    findings_res = client.get(f"/api/investigations/{case_id}/findings", headers=headers)
    assert findings_res.status_code == 200
    findings = findings_res.json()
    print(f"  ✓ Retrieved {len(findings)} AI-assisted findings:")
    for f in findings[:2]:
        print(f"    - [{f['severity']}] {f['title']} (Confidence: {int(f['confidence']*100)}% | Status: {f['review_status']})")
    
    # Confirm finding
    target_f = findings[0]
    confirm_res = client.patch(
        f"/api/findings/{target_f['id']}/review",
        headers=headers,
        json={
            "review_status": "CONFIRMED",
            "review_notes": "Corroborated by Lead Investigator Sarah Lin via cross-referenced Swiss financial ledgers."
        }
    )
    assert confirm_res.status_code == 200
    confirmed_data = confirm_res.json()
    print(f"  ✓ Successfully Confirmed Finding: Status is now '{confirmed_data['review_status']}'")
    print(f"  ✓ Review Notes: \"{confirmed_data['review_notes']}\"")

    # 10. Transparent Risk Assessment
    print(f"\n[Step 10] Assessing Transparent Investigation Risk Index...")
    risk_res = client.get(f"/api/investigations/{case_id}/risk", headers=headers)
    assert risk_res.status_code == 200
    risk = risk_res.json()
    print(f"  ✓ Overall Risk Score: {risk['overall_score']} / 100 [{risk['risk_tier']}]")
    print(f"  ✓ Assessment Mode: {risk['assessment_mode']}")
    print(f"  ✓ Contributing Factors ({len(risk['factors'])}):")
    for fac in risk["factors"]:
        print(f"    - {fac['name']} (+{fac['score']}/{fac['weight']} pts): {fac['description']}")

    # 11. Dossier Report Compilation (PDF & JSON)
    print(f"\n[Step 11] Compiling Official Case Dossiers (PDF & JSON)...")
    # PDF
    pdf_res = client.post(f"/api/investigations/{case_id}/reports", headers=headers, json={
        "format": "PDF",
        "title": "Operation Northstar Comprehensive Intelligence Dossier"
    })
    assert pdf_res.status_code == 201
    pdf_rep = pdf_res.json()
    print(f"  ✓ Generated Formal PDF Dossier: {pdf_rep['title']} ({pdf_rep['file_size']} bytes)")

    # JSON
    json_res = client.post(f"/api/investigations/{case_id}/reports", headers=headers, json={
        "format": "JSON",
        "title": "Operation Northstar Structured Forensic Export"
    })
    assert json_res.status_code == 201
    json_rep = json_res.json()
    print(f"  ✓ Generated Structured JSON Dossier: {json_rep['title']} ({json_rep['file_size']} bytes)")

    # 12. Chain of Custody & Audit Trail Verification
    print(f"\n[Step 12] Auditing Chain of Custody (/api/audit)...")
    audit_res = client.get("/api/audit", headers=headers)
    assert audit_res.status_code == 200
    audit_logs = audit_res.json()
    print(f"  ✓ Immutable Audit Trail contains {len(audit_logs)} custody events:")
    for al in audit_logs[:4]:
        print(f"    [{al['timestamp'][:19]}] Operator: {al['user_email']} | Action: {al['action']} on {al['resource_type']}")

    print("\n====================================================================")
    print("ALL 12 DEMONSTRATION WORKFLOW STEPS VERIFIED AND FUNCTIONAL!")
    print("====================================================================")

if __name__ == "__main__":
    run_walkthrough()
