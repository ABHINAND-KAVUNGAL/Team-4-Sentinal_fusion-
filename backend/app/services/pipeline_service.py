import json
import traceback
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.evidence import Evidence, EvidenceStatus, ProcessingStage, JobStatus, ProcessingJob, EvidenceMetadata
from app.models.entities import Entity, EntityType, Relationship, RelationshipType
from app.models.findings import Finding, FindingSeverity, ReviewStatus
from app.models.timeline import TimelineEvent, EventCategory
from app.models.audit import AuditAction
from app.services.metadata_service import MetadataService
from app.services.authenticity_service import MediaAuthenticityService
from app.services.ocr_service import OCRService
from app.services.risk_service import RiskService
from app.services.audit_service import AuditService
from app.providers.factory import get_ai_provider

class PipelineService:
    @classmethod
    async def process_evidence(cls, db: Session, evidence_id: str, user=None) -> bool:
        evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
        if not evidence:
            return False

        evidence.status = EvidenceStatus.PROCESSING
        db.commit()

        stages = [
            ProcessingStage.HASHING,
            ProcessingStage.METADATA,
            ProcessingStage.TEXT_OCR,
            ProcessingStage.ENTITY_EXTRACTION,
            ProcessingStage.AI_ANALYSIS,
        ]

        ai_provider = await get_ai_provider()
        authenticity_svc = MediaAuthenticityService()
        meta_dict = {}
        extracted_text = ""

        try:
            for stage in stages:
                evidence.processing_stage = stage
                job = ProcessingJob(
                    evidence_id=evidence.id,
                    stage=stage,
                    status=JobStatus.RUNNING,
                    started_at=datetime.utcnow()
                )
                db.add(job)
                db.commit()

                try:
                    if stage == ProcessingStage.HASHING:
                        computed_hash = MetadataService.calculate_sha256(evidence.storage_path)
                        evidence.sha256_hash = computed_hash
                        job.status = JobStatus.COMPLETED
                        job.completed_at = datetime.utcnow()

                    elif stage == ProcessingStage.METADATA:
                        if evidence.mime_type.startswith("image/"):
                            meta_dict = MetadataService.extract_image_metadata(evidence.storage_path)
                            auth_res = authenticity_svc.evaluate_media(evidence.storage_path, evidence.mime_type, meta_dict)
                            meta_dict["authenticity"] = auth_res
                        else:
                            meta_dict = MetadataService.extract_document_metadata(evidence.storage_path, evidence.mime_type)
                            auth_res = {"authenticity_score": 0.0, "authenticity_notes": "Not an image. Tampering analysis not applicable."}

                        # Persist metadata record
                        existing_meta = db.query(EvidenceMetadata).filter(EvidenceMetadata.evidence_id == evidence.id).first()
                        if not existing_meta:
                            existing_meta = EvidenceMetadata(
                                evidence_id=evidence.id,
                                file_format=meta_dict.get("format"),
                                width=meta_dict.get("width"),
                                height=meta_dict.get("height"),
                                created_date=meta_dict.get("created_date"),
                                device_make=meta_dict.get("device_make"),
                                device_model=meta_dict.get("device_model"),
                                gps_latitude=meta_dict.get("gps_latitude"),
                                gps_longitude=meta_dict.get("gps_longitude"),
                                author=meta_dict.get("author"),
                                page_count=meta_dict.get("page_count", 1),
                                authenticity_score=auth_res.get("authenticity_score"),
                                authenticity_notes=auth_res.get("authenticity_notes"),
                                raw_metadata_json=json.dumps(meta_dict.get("raw", {}))
                            )
                            db.add(existing_meta)
                        else:
                            existing_meta.file_format = meta_dict.get("format")
                            existing_meta.width = meta_dict.get("width")
                            existing_meta.height = meta_dict.get("height")
                            existing_meta.authenticity_score = auth_res.get("authenticity_score")
                            existing_meta.authenticity_notes = auth_res.get("authenticity_notes")

                        job.status = JobStatus.COMPLETED
                        job.completed_at = datetime.utcnow()

                    elif stage == ProcessingStage.TEXT_OCR:
                        extracted_text, _ = OCRService.extract_text_from_file(evidence.storage_path, evidence.mime_type)
                        meta_rec = db.query(EvidenceMetadata).filter(EvidenceMetadata.evidence_id == evidence.id).first()
                        if meta_rec:
                            meta_rec.extracted_text = extracted_text
                        job.status = JobStatus.COMPLETED
                        job.completed_at = datetime.utcnow()

                    elif stage == ProcessingStage.ENTITY_EXTRACTION:
                        discovered_entities = await ai_provider.extract_entities(extracted_text)
                        for ent_data in discovered_entities:
                            # Avoid duplicates per case
                            existing_ent = db.query(Entity).filter(
                                Entity.investigation_id == evidence.investigation_id,
                                Entity.name == ent_data["name"]
                            ).first()
                            
                            category = getattr(EntityType, ent_data.get("category", "PERSON"), EntityType.PERSON)
                            if not existing_ent:
                                new_ent = Entity(
                                    investigation_id=evidence.investigation_id,
                                    name=ent_data["name"],
                                    category=category,
                                    risk_score=ent_data.get("risk_score", 30),
                                    attributes_json=json.dumps(ent_data.get("attributes", {}))
                                )
                                db.add(new_ent)
                                db.flush()
                                ent_id = new_ent.id
                            else:
                                ent_id = existing_ent.id

                            # Create relationship with this evidence
                            rel_exists = db.query(Relationship).filter(
                                Relationship.investigation_id == evidence.investigation_id,
                                Relationship.source_entity_id == ent_id,
                                Relationship.evidence_id == evidence.id
                            ).first()
                            if not rel_exists:
                                rel = Relationship(
                                    investigation_id=evidence.investigation_id,
                                    source_entity_id=ent_id,
                                    target_entity_id=ent_id,  # self-ref or evidence anchor
                                    relationship_type=RelationshipType.APPEARS_IN,
                                    confidence=0.9,
                                    evidence_id=evidence.id,
                                    description=f"Entity appears in evidence '{evidence.original_filename}'"
                                )
                                db.add(rel)

                        job.status = JobStatus.COMPLETED
                        job.completed_at = datetime.utcnow()

                    elif stage == ProcessingStage.AI_ANALYSIS:
                        auth_data = meta_dict.get("authenticity", {})
                        findings_data = await ai_provider.generate_findings(extracted_text, auth_data, evidence.original_filename)
                        
                        for f_item in findings_data:
                            severity = getattr(FindingSeverity, f_item.get("severity", "MEDIUM"), FindingSeverity.MEDIUM)
                            finding = Finding(
                                investigation_id=evidence.investigation_id,
                                evidence_id=evidence.id,
                                title=f_item["title"],
                                summary=f_item["summary"],
                                severity=severity,
                                confidence=f_item.get("confidence", 0.85),
                                review_status=ReviewStatus.NEW,
                                explanation=f_item.get("explanation"),
                                analysis_mode=f_item.get("analysis_mode", ai_provider.get_provider_name())
                            )
                            db.add(finding)

                        # Create timeline event if date or time exists
                        if meta_dict.get("created_date"):
                            try:
                                dt = datetime.strptime(meta_dict["created_date"], "%Y-%m-%d %H:%M:%S")
                            except Exception:
                                dt = datetime.utcnow()
                            ev_event = TimelineEvent(
                                investigation_id=evidence.investigation_id,
                                evidence_id=evidence.id,
                                timestamp=dt,
                                title=f"Evidence Logged: {evidence.title}",
                                description=f"Ingested and analyzed item {evidence.original_filename}. Initial hash: {evidence.sha256_hash[:12]}...",
                                category=EventCategory.MEDIA if evidence.mime_type.startswith("image/") else EventCategory.GENERAL,
                                confidence=1.0,
                                is_demo=False
                            )
                            db.add(ev_event)

                        job.status = JobStatus.COMPLETED
                        job.completed_at = datetime.utcnow()

                    db.commit()

                except Exception as step_err:
                    job.status = JobStatus.FAILED
                    job.error_message = f"{step_err}\n{traceback.format_exc()}"
                    job.completed_at = datetime.utcnow()
                    db.commit()
                    raise step_err

            # Mark complete
            evidence.status = EvidenceStatus.ANALYZED
            evidence.processing_stage = ProcessingStage.COMPLETE
            db.commit()

            # Recalculate case risk
            RiskService.calculate_investigation_risk(db, evidence.investigation_id)

            # Audit log
            AuditService.log(
                db=db,
                action=AuditAction.EVIDENCE_PROCESS,
                resource_type="evidence",
                resource_id=evidence.id,
                investigation_id=evidence.investigation_id,
                user=user,
                details={"filename": evidence.original_filename, "hash": evidence.sha256_hash, "stage": "COMPLETE"}
            )
            return True

        except Exception as e:
            evidence.status = EvidenceStatus.ERROR
            evidence.processing_stage = ProcessingStage.FAILED
            db.commit()
            return False
