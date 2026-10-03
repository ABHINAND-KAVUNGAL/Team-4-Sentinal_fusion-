import os
import sys

# Ensure backend root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import json
import hashlib
from datetime import datetime, timedelta
from PIL import Image, ImageDraw
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
from app.config import settings
from app.models import (
    User, Role, Investigation, InvestigationMember, InvestigationStatus, Priority,
    Evidence, EvidenceMetadata, ProcessingJob, EvidenceStatus, ProcessingStage, JobStatus,
    Entity, Relationship, EntityType, RelationshipType,
    TimelineEvent, EventCategory,
    Finding, FindingSeverity, ReviewStatus,
    RiskAssessment, RiskTier,
    AuditLog, AuditAction
)
from app.utils.security import hash_password
from app.services.risk_service import RiskService
from app.services.metadata_service import MetadataService

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        existing_user = db.query(User).filter(User.email == "lead.investigator@sentinel.local").first()
        if existing_user:
            print("Database already contains seed data. Refreshing seed case...")
            # We can re-seed or skip
        
        # 1. Create Demo Users
        password_hash = hash_password("Password123!")

        lead_user = db.query(User).filter(User.email == "lead.investigator@sentinel.local").first()
        if not lead_user:
            lead_user = User(
                email="lead.investigator@sentinel.local",
                hashed_password=password_hash,
                full_name="Sarah Lin",
                role=Role.INVESTIGATOR,
                is_active=True
            )
            db.add(lead_user)
        else:
            lead_user.hashed_password = password_hash
            lead_user.is_active = True

        analyst_user = db.query(User).filter(User.email == "analyst@sentinel.local").first()
        if not analyst_user:
            analyst_user = User(
                email="analyst@sentinel.local",
                hashed_password=password_hash,
                full_name="Marcus Vance",
                role=Role.ANALYST,
                is_active=True
            )
            db.add(analyst_user)
        else:
            analyst_user.hashed_password = password_hash
            analyst_user.is_active = True

        admin_user = db.query(User).filter(User.email == "admin@sentinel.local").first()
        if not admin_user:
            admin_user = User(
                email="admin@sentinel.local",
                hashed_password=password_hash,
                full_name="System Administrator",
                role=Role.ADMIN,
                is_active=True
            )
            db.add(admin_user)
        else:
            admin_user.hashed_password = password_hash
            admin_user.is_active = True

        demo_user = db.query(User).filter(User.email == "demo@sentinelfusion.local").first()
        if not demo_user:
            demo_user = User(
                email="demo@sentinelfusion.local",
                hashed_password=password_hash,
                full_name="Sarah Lin (Demo Persona)",
                role=Role.INVESTIGATOR,
                is_active=True
            )
            db.add(demo_user)
        else:
            demo_user.hashed_password = password_hash
            demo_user.is_active = True

        db.commit()
        db.refresh(lead_user)
        db.refresh(analyst_user)
        db.refresh(admin_user)

        # 2. Create Operation Northstar Investigation
        inv = db.query(Investigation).filter(Investigation.case_number == "SF-2026-001").first()
        if not inv:
            inv = Investigation(
                case_number="SF-2026-001",
                title="Operation Northstar [DEMO DATA]",
                description=(
                    "Multi-jurisdictional intelligence inquiry regarding syndicated corporate asset diversion, "
                    "suspicious capital flight through Swiss logistics entities, and clandestine proxy communications."
                ),
                status=InvestigationStatus.ACTIVE,
                priority=Priority.HIGH,
                lead_investigator_id=lead_user.id,
                created_at=datetime.utcnow() - timedelta(days=5),
                updated_at=datetime.utcnow()
            )
            db.add(inv)
            db.commit()
            db.refresh(inv)

            # Assign members
            m1 = InvestigationMember(investigation_id=inv.id, user_id=lead_user.id, role_in_case="Lead Investigator")
            m2 = InvestigationMember(investigation_id=inv.id, user_id=analyst_user.id, role_in_case="Forensic Intelligence Analyst")
            db.add_all([m1, m2])
            db.commit()

        # 3. Create Physical Evidence Files on Disk
        vault_dir = os.path.join(settings.STORAGE_PATH, "evidence", inv.id)
        os.makedirs(vault_dir, exist_ok=True)

        # File 1: Financial Ledger CSV
        f1_path = os.path.join(vault_dir, "financial_ledger_extract.csv")
        with open(f1_path, "w", encoding="utf-8") as f:
            f.write(
                "Transaction_ID,Date,Origin_Entity,Destination_Entity,Amount_USD,Routing_Ref,Currency\n"
                "TX-88219,2026-03-12,Meridian Logistics AG,Northstar Holdings LLC,1450000.00,SWIFT-CH-ZUR-991,USD\n"
                "TX-88220,2026-03-14,Northstar Holdings LLC,0x71C8366420A8f88A65E8385361725A4232e0B29f,350000.00,ETH-COLD-VAULT,USD\n"
                "TX-88224,2026-03-18,Meridian Logistics AG,Elena Rostova,85000.00,IBAN-CY-NIC-1029,EUR\n"
                "TX-88231,2026-03-22,ShellCorp International,Viktor Kozlov,420000.00,DIRECT-WIRE-OFFSHORE,USD\n"
            )

        # File 2: Intercepted Memo TXT
        f2_path = os.path.join(vault_dir, "intercepted_memo.txt")
        with open(f2_path, "w", encoding="utf-8") as f:
            f.write(
                "CONFIDENTIAL MEMORANDUM [EXTRACTED FROM CLOUD BACKUP]\n"
                "DATE: 2026-03-19\n"
                "FROM: v.kozlov@protonmail.ch\n"
                "TO: elena.rostova@meridian-logistics.ch\n"
                "SUBJECT: Protocol update for Zurich rendezvous\n\n"
                "Elena,\n"
                "Ensure all wire transfers to Northstar Holdings LLC are cleared prior to Wednesday.\n"
                "Do not use normal cellular circuits. Switch communications exclusively to Signal on the burn phone.\n"
                "Delete this transmission immediately after reading.\n"
                "Endpoint proxy active at 194.26.29.114 via Zurich gateway.\n"
                "The escrow wallet 0x71C8366420A8f88A65E8385361725A4232e0B29f is ready for the second tranche.\n"
            )

        # File 3: Surveillance Photo JPG
        f3_path = os.path.join(vault_dir, "surveillance_contact_photo.jpg")
        img = Image.new("RGB", (800, 600), color=(30, 41, 59))
        draw = ImageDraw.Draw(img)
        draw.rectangle([100, 100, 700, 500], outline=(59, 130, 246), width=3)
        draw.text((120, 120), "SENTINEL FORENSIC IMAGING - SURVEILLANCE STILL", fill=(241, 245, 249))
        draw.text((120, 160), "TARGET: VIKTOR KOZLOV & ELENA ROSTOVA", fill=(148, 163, 184))
        draw.text((120, 200), "LOCATION: BAHNHOFSTRASSE, ZURICH", fill=(148, 163, 184))
        draw.text((120, 240), "TIMESTAMP: 2026-03-20 14:22:18 CET", fill=(148, 163, 184))
        img.save(f3_path, "JPEG")

        # File 4: Incorporation Document PDF
        f4_path = os.path.join(vault_dir, "offshore_incorporation_deed.pdf")
        with open(f4_path, "wb") as f:
            # Minimal syntactically valid PDF with text stream
            pdf_bytes = (
                b"%PDF-1.4\n"
                b"1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n"
                b"2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n"
                b"3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R>> endobj\n"
                b"4 0 obj <</Length 180>> stream\n"
                b"BT /F1 12 Tf 72 712 Td (OFFSHORE REGISTRY OF ENTERPRISES - NICOSIA) Tj\n"
                b"0 -20 Td (Entity: Northstar Holdings LLC. Registered Agent: Viktor Kozlov.) Tj\n"
                b"0 -20 Td (Nominee Director: Elena Rostova. Authorized Capital: USD 5,000,000.) Tj\n"
                b"ET endstream endobj\n"
                b"xref\n0 5\n0000000000 65535 f\n0000000010 00000 n\n0000000056 00000 n\n0000000115 00000 n\n0000000214 00000 n\n"
                b"trailer <</Size 5 /Root 1 0 R /Info <</Author (Registrar General)>> >>\nstartxref\n440\n%%EOF"
            )
            f.write(pdf_bytes)

        # 4. Ingest and Link Evidence Records
        evidence_files = [
            ("financial_ledger_extract.csv", f1_path, "text/csv", "Financial Wire Transaction Ledger [DEMO]"),
            ("intercepted_memo.txt", f2_path, "text/plain", "Intercepted Operational Memo [DEMO]"),
            ("surveillance_contact_photo.jpg", f3_path, "image/jpeg", "Surveillance Photographic Still [DEMO]"),
            ("offshore_incorporation_deed.pdf", f4_path, "application/pdf", "Offshore Incorporation Deed [DEMO]")
        ]

        ev_records = {}
        for fname, fpath, mime, title in evidence_files:
            existing_ev = db.query(Evidence).filter(
                Evidence.investigation_id == inv.id,
                Evidence.original_filename == fname
            ).first()

            sha256 = MetadataService.calculate_sha256(fpath)
            fsize = os.path.getsize(fpath)

            if not existing_ev:
                ev = Evidence(
                    investigation_id=inv.id,
                    title=title,
                    original_filename=fname,
                    stored_filename=fname,
                    storage_path=fpath,
                    mime_type=mime,
                    file_size=fsize,
                    sha256_hash=sha256,
                    status=EvidenceStatus.ANALYZED,
                    processing_stage=ProcessingStage.COMPLETE,
                    uploaded_by_id=lead_user.id,
                    created_at=datetime.utcnow() - timedelta(days=3)
                )
                db.add(ev)
                db.commit()
                db.refresh(ev)
                ev_records[fname] = ev

                # Processing Jobs History
                stages = [ProcessingStage.HASHING, ProcessingStage.METADATA, ProcessingStage.TEXT_OCR, ProcessingStage.ENTITY_EXTRACTION, ProcessingStage.AI_ANALYSIS]
                for st in stages:
                    job = ProcessingJob(
                        evidence_id=ev.id,
                        stage=st,
                        status=JobStatus.COMPLETED,
                        started_at=ev.created_at,
                        completed_at=ev.created_at + timedelta(seconds=2)
                    )
                    db.add(job)

                # Metadata record
                with open(fpath, "r" if not fname.endswith((".jpg", ".pdf")) else "rb") as rf:
                    content_preview = rf.read(2000) if not fname.endswith((".jpg", ".pdf")) else "[Binary Data Ingested]"

                meta = EvidenceMetadata(
                    evidence_id=ev.id,
                    file_format=mime.split("/")[-1].upper(),
                    width=800 if fname.endswith(".jpg") else None,
                    height=600 if fname.endswith(".jpg") else None,
                    created_date="2026-03-20 14:22:18" if fname.endswith(".jpg") else "2026-03-12 09:15:00",
                    device_make="Sony" if fname.endswith(".jpg") else None,
                    device_model="Alpha 7 IV" if fname.endswith(".jpg") else None,
                    gps_latitude=47.3769 if fname.endswith(".jpg") else None,
                    gps_longitude=8.5417 if fname.endswith(".jpg") else None,
                    author="Registrar General" if fname.endswith(".pdf") else None,
                    extracted_text=str(content_preview),
                    authenticity_score=0.82 if fname.endswith(".jpg") else 0.10,
                    authenticity_notes="Demonstration / heuristic analysis: EXIF camera parameters verified against image raster dimensions. Minor compression artifacts flagged." if fname.endswith(".jpg") else "Direct document extraction verified.",
                    raw_metadata_json=json.dumps({"source": "Forensic Ingestion Suite", "verified": True})
                )
                db.add(meta)
                db.commit()
            else:
                ev_records[fname] = existing_ev

        # 5. Seed Entities
        entities_data = [
            ("Viktor Kozlov", EntityType.PERSON, 85, {"role": "Primary Target", "nationality": "Russian/Swiss", "flagged": True}),
            ("Elena Rostova", EntityType.PERSON, 68, {"role": "Financial Officer", "organization": "Meridian Logistics AG"}),
            ("Northstar Holdings LLC", EntityType.ORGANIZATION, 75, {"jurisdiction": "Nicosia, Cyprus", "type": "Shell Company"}),
            ("Meridian Logistics AG", EntityType.ORGANIZATION, 62, {"jurisdiction": "Zurich, Switzerland", "sector": "Freight & Logistics"}),
            ("0x71C8366420A8f88A65E8385361725A4232e0B29f", EntityType.ACCOUNT, 82, {"type": "Ethereum Cold Storage Wallet", "balance_usd": 350000}),
            ("v.kozlov@protonmail.ch", EntityType.ACCOUNT, 65, {"service": "ProtonMail Encrypted Gateway"}),
            ("194.26.29.114", EntityType.DEVICE, 58, {"type": "Offshore Proxy Gateway", "isp": "PrivateLayer AG"}),
            ("Zurich Financial District", EntityType.LOCATION, 45, {"country": "Switzerland", "coordinates": "47.3769, 8.5417"}),
        ]

        ent_map = {}
        for name, cat, risk_val, attrs in entities_data:
            existing_ent = db.query(Entity).filter(Entity.investigation_id == inv.id, Entity.name == name).first()
            if not existing_ent:
                ent = Entity(
                    investigation_id=inv.id,
                    name=name,
                    category=cat,
                    risk_score=risk_val,
                    attributes_json=json.dumps(attrs)
                )
                db.add(ent)
                db.commit()
                db.refresh(ent)
                ent_map[name] = ent
            else:
                ent_map[name] = existing_ent

        # 6. Seed Relationships
        relationships_data = [
            ("Viktor Kozlov", "Northstar Holdings LLC", RelationshipType.OWNS, 0.95, "Beneficial ownership identified via incorporation deed"),
            ("Viktor Kozlov", "v.kozlov@protonmail.ch", RelationshipType.USES, 0.98, "Direct electronic mail sender address in memo"),
            ("Viktor Kozlov", "Zurich Financial District", RelationshipType.LOCATED_AT, 0.88, "Geotagged photographic surveillance confirmed location"),
            ("Elena Rostova", "Meridian Logistics AG", RelationshipType.ASSOCIATED_WITH, 0.92, "Authorized signatory on outgoing wire transfers"),
            ("Elena Rostova", "Viktor Kozlov", RelationshipType.COMMUNICATED_WITH, 0.89, "Operational memorandum directed to Elena with wire transfer instructions"),
            ("Meridian Logistics AG", "Northstar Holdings LLC", RelationshipType.COMMUNICATED_WITH, 0.95, "Multiple cross-border wire transfers totaling $1.45M USD"),
            ("Northstar Holdings LLC", "0x71C8366420A8f88A65E8385361725A4232e0B29f", RelationshipType.USES, 0.84, "Wire conversion to cold wallet escrow identified in ledger"),
            ("194.26.29.114", "Viktor Kozlov", RelationshipType.USES, 0.80, "Proxy IP cited as target endpoint gateway in communication"),
        ]

        for src_name, tgt_name, rel_type, conf, desc in relationships_data:
            src = ent_map.get(src_name)
            tgt = ent_map.get(tgt_name)
            if src and tgt:
                existing_rel = db.query(Relationship).filter(
                    Relationship.investigation_id == inv.id,
                    Relationship.source_entity_id == src.id,
                    Relationship.target_entity_id == tgt.id,
                    Relationship.relationship_type == rel_type
                ).first()
                if not existing_rel:
                    rel = Relationship(
                        investigation_id=inv.id,
                        source_entity_id=src.id,
                        target_entity_id=tgt.id,
                        relationship_type=rel_type,
                        confidence=conf,
                        description=desc
                    )
                    db.add(rel)

        db.commit()

        # 7. Seed Timeline Events
        timeline_data = [
            ("2026-03-12 11:22:00", "Wire Transfer $1,450,000 Dispatched", "Meridian Logistics AG initiated wire to Northstar Holdings LLC via Swiss gateway.", EventCategory.TRANSACTION, 1.0, "financial_ledger_extract.csv"),
            ("2026-03-14 16:45:00", "Cryptocurrency Conversion to Cold Vault", "350,000 USD converted to ETH and relocated to wallet 0x71C...B29f.", EventCategory.TRANSACTION, 0.95, "financial_ledger_extract.csv"),
            ("2026-03-19 08:30:00", "Encrypted Operational Directive Transmitted", "Intercepted memo from v.kozlov@protonmail.ch commanding switch to burn phone Signal circuit.", EventCategory.COMMUNICATION, 0.92, "intercepted_memo.txt"),
            ("2026-03-20 14:22:18", "Zurich Rendezvous & Contact Observed", "Photographic surveillance captured target Viktor Kozlov and associate in Zurich Financial District.", EventCategory.LOCATION, 0.88, "surveillance_contact_photo.jpg"),
            ("2026-03-22 17:10:00", "Offshore Entity Incorporation Filed", "Official registry document filed in Nicosia listing Viktor Kozlov as beneficial agent.", EventCategory.ACCESS, 0.99, "offshore_incorporation_deed.pdf"),
        ]

        for dt_str, title, desc, cat, conf, ev_key in timeline_data:
            existing_event = db.query(TimelineEvent).filter(
                TimelineEvent.investigation_id == inv.id,
                TimelineEvent.title == title
            ).first()
            if not existing_event:
                ev_obj = ev_records.get(ev_key)
                te = TimelineEvent(
                    investigation_id=inv.id,
                    evidence_id=ev_obj.id if ev_obj else None,
                    timestamp=datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S"),
                    title=title,
                    description=desc,
                    category=cat,
                    confidence=conf,
                    is_demo=True
                )
                db.add(te)

        db.commit()

        # 8. Seed AI Findings
        findings_data = [
            (
                "Unsanctioned Capital Outflow via Layered Transfers",
                "Deterministic rule analysis detected structured capital flight totaling over $1.8M across Swiss and Cypriot accounts.",
                FindingSeverity.CRITICAL,
                0.92,
                ReviewStatus.CONFIRMED,
                "Demonstration / Heuristic Rule Match: Transaction velocity and swift routing anomalies cross-correlated between ledger records and entity profiles.",
                "financial_ledger_extract.csv"
            ),
            (
                "Operational Security & Counter-Surveillance Directive",
                "Evidence contains explicit instructions to transition to burn phones and delete communications.",
                FindingSeverity.HIGH,
                0.89,
                ReviewStatus.REVIEWED,
                "Keyword heuristic matched 'burn phone', 'signal', and 'delete after reading'. High OPSEC indicators suggest organized evasion.",
                "intercepted_memo.txt"
            ),
            (
                "Surveillance Photograph Authenticity & Sensor Inspection",
                "Heuristic inspection confirms image EXIF timestamps match physical lighting and Zurich GPS coordinates.",
                FindingSeverity.MEDIUM,
                0.78,
                ReviewStatus.NEW,
                "Sensor model Sony Alpha 7 IV metadata matches native aspect ratio. No overt cloned pixel clusters found in preliminary inspection pass.",
                "surveillance_contact_photo.jpg"
            ),
            (
                "High-Value Ethereum Wallet Cold Storage Link",
                "Address 0x71C8366420A8f88A65E8385361725A4232e0B29f linked to Northstar Holdings funding stream.",
                FindingSeverity.HIGH,
                0.86,
                ReviewStatus.NEW,
                "Regex wallet pattern match identified crypto asset diversion bypassing banking oversight.",
                "financial_ledger_extract.csv"
            )
        ]

        for title, summ, sev, conf, rev_st, expl, ev_key in findings_data:
            existing_f = db.query(Finding).filter(
                Finding.investigation_id == inv.id,
                Finding.title == title
            ).first()
            if not existing_f:
                ev_obj = ev_records.get(ev_key)
                f_item = Finding(
                    investigation_id=inv.id,
                    evidence_id=ev_obj.id if ev_obj else None,
                    title=title,
                    summary=summ,
                    severity=sev,
                    confidence=conf,
                    review_status=rev_st,
                    reviewed_by_id=lead_user.id if rev_st in (ReviewStatus.CONFIRMED, ReviewStatus.REVIEWED) else None,
                    reviewed_at=datetime.utcnow() - timedelta(hours=4) if rev_st in (ReviewStatus.CONFIRMED, ReviewStatus.REVIEWED) else None,
                    review_notes="Investigator confirmed cross-border transaction trail matches financial audit." if rev_st == ReviewStatus.CONFIRMED else None,
                    explanation=expl,
                    analysis_mode="DEMO_ANALYSIS"
                )
                db.add(f_item)

        db.commit()

        # 9. Compute Initial Risk Assessment
        RiskService.calculate_investigation_risk(db, inv.id)

        # 10. Seed Initial Audit Logs
        audit_records = [
            (AuditAction.LOGIN, "user", lead_user.id, {"email": lead_user.email}, datetime.utcnow() - timedelta(days=5)),
            (AuditAction.CASE_CREATE, "investigation", inv.id, {"case_number": inv.case_number, "title": inv.title}, datetime.utcnow() - timedelta(days=5)),
            (AuditAction.EVIDENCE_UPLOAD, "evidence", ev_records.get("financial_ledger_extract.csv").id, {"filename": "financial_ledger_extract.csv"}, datetime.utcnow() - timedelta(days=3)),
            (AuditAction.EVIDENCE_PROCESS, "evidence", ev_records.get("financial_ledger_extract.csv").id, {"stage": "COMPLETE"}, datetime.utcnow() - timedelta(days=3)),
            (AuditAction.FINDING_REVIEW, "finding", None, {"status": "CONFIRMED", "notes": "Investigator corroborated wire records."}, datetime.utcnow() - timedelta(hours=4)),
        ]

        for act, r_type, r_id, details, dt in audit_records:
            log = AuditLog(
                user_id=lead_user.id,
                user_email=lead_user.email,
                investigation_id=inv.id,
                action=act,
                resource_type=r_type,
                resource_id=r_id,
                details_json=json.dumps(details),
                ip_address="127.0.0.1",
                timestamp=dt
            )
            db.add(log)

        db.commit()
        print("Successfully seeded Operation Northstar (SF-2026-001) into Sentinel Fusion database!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
