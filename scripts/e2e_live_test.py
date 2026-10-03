#!/usr/bin/env python3
"""
Sentinel Fusion End-to-End Live HTTP Test Suite
Verifies all backend routes and workflows against the live running server at http://localhost:8000.
"""

import sys
import io
import httpx

BASE_URL = "http://localhost:8000"

def log_step(step_num: int, title: str):
    print(f"\n[Test {step_num:02d}] {title}")

def main():
    print("====================================================================")
    print("   SENTINEL FUSION: FULL-STACK LIVE API AUDIT & VERIFICATION")
    print("====================================================================")

    client = httpx.Client(base_url=BASE_URL, timeout=15.0, follow_redirects=True)

    # 1. Health & Status
    log_step(1, "Health and Diagnostics Endpoints")
    r = client.get("/health")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    print(f"  ✓ /health: {r.json()}")

    r = client.get("/api/health")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    print(f"  ✓ /api/health: {r.json()}")

    r = client.get("/api/system/status")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    status_data = r.json()
    print(f"  ✓ DB Status: {status_data['database']['status']}")
    print(f"  ✓ AI Provider: {status_data['ai_provider']['details']}")

    # 2. Authentication of all 4 demo users
    log_step(2, "Authentication for all 4 Demo Accounts")
    users = [
        ("demo@sentinelfusion.local", "Password123!", "Demo Persona"),
        ("lead.investigator@sentinel.local", "Password123!", "Lead Investigator"),
        ("analyst@sentinel.local", "Password123!", "Senior Analyst"),
        ("admin@sentinel.local", "Password123!", "Administrator"),
    ]

    tokens = {}
    for email, pwd, role_desc in users:
        payload = {"email": email, "password": pwd}
        r = client.post("/api/auth/login", json=payload)
        assert r.status_code == 200, f"Login failed for {email}: {r.text}"
        token = r.json()["access_token"]
        tokens[email] = token
        
        # Verify /auth/me
        headers = {"Authorization": f"Bearer {token}"}
        me_r = client.get("/api/auth/me", headers=headers)
        assert me_r.status_code == 200, f"/auth/me failed for {email}: {me_r.text}"
        me_data = me_r.json()
        print(f"  ✓ {me_data['full_name']} ({email}) -> Role: {me_data['role']} [{role_desc}]")

    demo_token = tokens["demo@sentinelfusion.local"]
    auth_headers = {"Authorization": f"Bearer {demo_token}"}

    # 3. Invalid credentials test (Error state)
    log_step(3, "Authentication Error Handling (Invalid Credentials)")
    r = client.post("/api/auth/login", json={"email": "demo@sentinelfusion.local", "password": "WrongPassword!"})
    assert r.status_code == 401, f"Expected 401 for wrong password, got {r.status_code}"
    print("  ✓ Correctly rejected invalid password with HTTP 401")

    # 4. List Investigations & Verify Operation Northstar
    log_step(4, "Investigation Listing & Demo Case Verification")
    r = client.get("/api/investigations", headers=auth_headers)
    assert r.status_code == 200, f"Failed to list investigations: {r.text}"
    invs = r.json()
    assert len(invs) > 0, "No investigations found in database"
    northstar = next((i for i in invs if i["case_number"] == "SF-2026-001"), None)
    assert northstar is not None, "Demo case Operation Northstar (SF-2026-001) not found!"
    northstar_id = northstar["id"]
    print(f"  ✓ Found Operation Northstar: ID={northstar_id}, Status={northstar['status']}, Priority={northstar['priority']}")

    # 5. Open Investigation Details & Overview
    log_step(5, "Investigation Details & Metrics (/api/investigations/{id})")
    r = client.get(f"/api/investigations/{northstar_id}", headers=auth_headers)
    assert r.status_code == 200, f"Failed to get investigation {northstar_id}: {r.text}"
    inv_data = r.json()
    print(f"  ✓ Title: {inv_data['title']}")
    print(f"  ✓ Lead Investigator: {inv_data.get('lead_investigator', {}).get('full_name')}")

    # 6. Evidence Management & File Preview via Query Token
    log_step(6, "Evidence Management & Token Query File Streaming")
    r = client.get(f"/api/investigations/{northstar_id}/evidence", headers=auth_headers)
    assert r.status_code == 200, f"Failed to list evidence: {r.text}"
    ev_list = r.json()
    assert len(ev_list) > 0, "Expected seeded evidence items"
    print(f"  ✓ Retrieved {len(ev_list)} evidence items for SF-2026-001")

    # Test token query streaming on existing evidence file
    first_ev = ev_list[0]
    ev_id = first_ev["id"]
    print(f"  ✓ Testing evidence '{first_ev['title']}' (ID: {ev_id}, Hash: {first_ev['sha256_hash'][:16]}...)")
    
    # 6a. Direct Bearer header file download
    r = client.get(f"/api/evidence/{ev_id}/file", headers=auth_headers)
    assert r.status_code == 200, f"Direct file stream failed: {r.status_code}"
    print(f"  ✓ Direct stream with Bearer header: {len(r.content)} bytes received")

    # 6b. Browser Query Token file download (Fix verification)
    r = client.get(f"/api/evidence/{ev_id}/file?token={demo_token}")
    assert r.status_code == 200, f"Query token file stream failed: {r.status_code}"
    print(f"  ✓ Browser image/download URL with ?token=... query param: {len(r.content)} bytes received")

    # 6c. Verify unauthorized when no token provided
    r = client.get(f"/api/evidence/{ev_id}/file")
    assert r.status_code in [401, 403], f"Expected 401/403 without token, got {r.status_code}"
    print(f"  ✓ Correctly rejected unauthenticated file request: HTTP {r.status_code}")

    # 7. Evidence Ingestion & Automated SHA-256 Integrity Verification
    log_step(7, "Evidence Ingestion & Automatic SHA-256 Extraction")
    test_file_content = b"EOD Log: Suspicious offshore server 198.51.100.42 detected communicating with target wallet 0x71C... at 03:00 UTC."
    upload_data = {
        "title": "Automated Network Intercept Log"
    }
    files = [
        ("files", ("intercept_log.txt", io.BytesIO(test_file_content), "text/plain"))
    ]
    r = client.post(
        f"/api/investigations/{northstar_id}/evidence",
        headers=auth_headers,
        data=upload_data,
        files=files
    )
    assert r.status_code == 201, f"Evidence upload failed: {r.text}"
    uploaded_items = r.json()
    assert len(uploaded_items) > 0, "No items returned from upload"
    new_ev = uploaded_items[0]
    new_ev_id = new_ev["id"]
    print(f"  ✓ Ingested new evidence item: ID={new_ev_id}, SHA256={new_ev['sha256_hash']}")
    assert new_ev["sha256_hash"] is not None and len(new_ev["sha256_hash"]) == 64, "SHA-256 hash not computed correctly!"

    # 8. Intelligence Knowledge Graph & Entity Relationships
    log_step(8, "Intelligence Graph Views & Entity Manipulation")
    r = client.get(f"/api/investigations/{northstar_id}/graph", headers=auth_headers)
    assert r.status_code == 200, f"Failed to get graph: {r.text}"
    graph_data = r.json()
    print(f"  ✓ Initial Graph: {len(graph_data['nodes'])} entities, {len(graph_data['edges'])} relationships")

    # Add a new Entity
    new_entity_payload = {
        "name": "Seychelles Shadow Fund LLC",
        "category": "ORGANIZATION",
        "risk_score": 85,
        "attributes": {"jurisdiction": "Seychelles", "incorporation_year": 2021}
    }
    r = client.post(f"/api/investigations/{northstar_id}/entities", headers=auth_headers, json=new_entity_payload)
    assert r.status_code == 201, f"Failed to create entity: {r.text}"
    created_entity = r.json()
    entity_id = created_entity["id"]
    print(f"  ✓ Created Entity: '{created_entity['name']}' (ID={entity_id}, Risk={created_entity['risk_score']})")

    # Add a relationship
    if len(graph_data["nodes"]) > 0:
        target_node_id = graph_data["nodes"][0]["id"]
        rel_payload = {
            "source_entity_id": entity_id,
            "target_entity_id": target_node_id,
            "relationship_type": "COMMUNICATED_WITH",
            "description": "Shadow corporate shell communicating with primary suspect entity.",
            "confidence": 0.95
        }
        r = client.post(f"/api/investigations/{northstar_id}/relationships", headers=auth_headers, json=rel_payload)
        assert r.status_code == 201, f"Failed to create relationship: {r.text}"
        rel_data = r.json()
        print(f"  ✓ Created Relationship: {entity_id} -[{rel_data['relationship_type']}]-> {target_node_id}")

    # 9. AI-Assisted Findings & Review Workflow
    log_step(9, "AI Findings & Review Workflow")
    r = client.get(f"/api/investigations/{northstar_id}/findings", headers=auth_headers)
    assert r.status_code == 200, f"Failed to get findings: {r.text}"
    findings_list = r.json()
    print(f"  ✓ Retrieved {len(findings_list)} existing findings")

    if len(findings_list) > 0:
        target_finding = findings_list[0]
        finding_id = target_finding["id"]
        review_payload = {
            "review_status": "CONFIRMED",
            "review_notes": "Forensically validated by lead investigator."
        }
        r = client.patch(f"/api/findings/{finding_id}/review", headers=auth_headers, json=review_payload)
        assert r.status_code == 200, f"Failed to review finding: {r.text}"
        reviewed = r.json()
        print(f"  ✓ Reviewed finding '{reviewed['title'][:40]}...' -> Status: {reviewed['review_status']}")

    # 10. Risk Scoring & Threat Analysis
    log_step(10, "Case Risk Scoring & Threat Aggregation")
    r = client.get(f"/api/investigations/{northstar_id}/risk", headers=auth_headers)
    assert r.status_code == 200, f"Failed to get risk analysis: {r.text}"
    risk_data = r.json()
    print(f"  ✓ Overall Risk Score: {risk_data.get('overall_score')}/100 ({risk_data.get('threat_tier')})")
    print(f"  ✓ Top risk factors evaluated: {len(risk_data.get('top_risk_factors', []))}")

    # 11. Full-Text Search Across Investigation, Evidence & Entities
    log_step(11, "Global Omnibar Search API")
    r = client.get("/api/search?q=Northstar", headers=auth_headers)
    assert r.status_code == 200, f"Search failed: {r.text}"
    search_res = r.json()
    print(f"  ✓ Search query 'Northstar': {len(search_res.get('investigations', []))} cases, {len(search_res.get('evidence', []))} evidence items, {len(search_res.get('entities', []))} entities")

    # 12. Chain of Custody & Tamper-Evident Audit Logging
    log_step(12, "Chain of Custody & Audit Log Verification")
    r = client.get(f"/api/audit?investigation_id={northstar_id}", headers=auth_headers)
    assert r.status_code == 200, f"Failed to get audit log: {r.text}"
    audit_logs = r.json()
    assert len(audit_logs) > 0, "No audit logs found"
    print(f"  ✓ Chain of custody entries logged: {len(audit_logs)}")
    latest_action = audit_logs[0]
    print(f"  ✓ Latest action: [{latest_action.get('action')}] by {latest_action.get('user', {}).get('full_name')} ({latest_action.get('timestamp')})")

    # 13. Case Report Generation & Token Query Download
    log_step(13, "Forensic Case Report Generation (PDF/JSON) & Download")
    # Generate JSON report
    report_payload = {
        "title": "Comprehensive Operation Northstar Executive Summary",
        "format": "JSON"
    }
    r = client.post(f"/api/investigations/{northstar_id}/reports", headers=auth_headers, json=report_payload)
    assert r.status_code == 201, f"Failed to generate report: {r.text}"
    report_data = r.json()
    report_id = report_data["id"]
    print(f"  ✓ Generated report: ID={report_id}, File: {report_data.get('file_path')}")

    # Test Report Download via Query Token (Fix verification)
    r = client.get(f"/api/reports/{report_id}/download?token={demo_token}")
    assert r.status_code == 200, f"Report download failed: {r.status_code}"
    print(f"  ✓ Report download with ?token=...: {len(r.content)} bytes received")

    # 14. Non-Existent Entity / 404 Handlers
    log_step(14, "404 Error State Verification")
    r = client.get("/api/investigations/00000000-0000-0000-0000-000000000000", headers=auth_headers)
    assert r.status_code == 404, f"Expected 404 for invalid ID, got {r.status_code}"
    print("  ✓ Correctly returned HTTP 404 for non-existent investigation")

    # 15. Logout
    log_step(15, "Session Termination / Logout")
    r = client.post("/api/auth/logout", headers=auth_headers)
    assert r.status_code == 200, f"Logout failed: {r.text}"
    print("  ✓ Successfully terminated session via /api/auth/logout")

    print("\n====================================================================")
    print("   ALL 15 LIVE END-TO-END WORKFLOW TESTS COMPLETED SUCCESSFULLY!")
    print("====================================================================")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ E2E TEST FAILED: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
