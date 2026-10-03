import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.users import User
from app.models.investigations import Investigation
from app.models.evidence import Evidence, EvidenceStatus, ProcessingStage
from app.models.audit import AuditAction
from app.schemas.evidence import EvidenceResponse, EvidenceDetailResponse, EvidenceMetadataResponse, ProcessingJobResponse
from app.services.metadata_service import MetadataService
from app.services.pipeline_service import PipelineService
from app.services.audit_service import AuditService
from app.api.deps import get_current_user
from app.config import settings

router = APIRouter(tags=["Evidence Management"])

@router.get("/investigations/{investigation_id}/evidence", response_model=List[EvidenceResponse])
def list_investigation_evidence(
    investigation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    items = db.query(Evidence).filter(Evidence.investigation_id == investigation_id).order_by(Evidence.created_at.desc()).all()
    return items

@router.post("/investigations/{investigation_id}/evidence", response_model=List[EvidenceResponse], status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    investigation_id: str,
    files: List[UploadFile] = File(...),
    title: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    vault_dir = os.path.join(settings.STORAGE_PATH, "evidence", investigation_id)
    os.makedirs(vault_dir, exist_ok=True)

    created_items = []

    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        unique_name = f"{uuid.uuid4()}{ext}"
        target_path = os.path.join(vault_dir, unique_name)

        # Write file securely to vault
        content = await file.read()
        file_size = len(content)
        with open(target_path, "wb") as f:
            f.write(content)

        # Immediate SHA-256 calculation
        sha256 = MetadataService.calculate_sha256(target_path)
        item_title = title if (title and len(files) == 1) else file.filename

        evidence = Evidence(
            investigation_id=investigation_id,
            title=item_title,
            original_filename=file.filename,
            stored_filename=unique_name,
            storage_path=target_path,
            mime_type=file.content_type or "application/octet-stream",
            file_size=file_size,
            sha256_hash=sha256,
            status=EvidenceStatus.UPLOADED,
            processing_stage=ProcessingStage.UPLOADED,
            uploaded_by_id=current_user.id
        )
        db.add(evidence)
        db.commit()
        db.refresh(evidence)

        AuditService.log(
            db=db,
            action=AuditAction.EVIDENCE_UPLOAD,
            resource_type="evidence",
            resource_id=evidence.id,
            investigation_id=investigation_id,
            user=current_user,
            details={"filename": file.filename, "size_bytes": file_size, "sha256": sha256}
        )

        # Run pipeline processing synchronously for immediate response in demo mode, or asynchronously
        await PipelineService.process_evidence(db, evidence.id, user=current_user)
        db.refresh(evidence)
        created_items.append(evidence)

    return created_items

@router.get("/evidence/{evidence_id}", response_model=EvidenceDetailResponse)
def get_evidence(
    evidence_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ev = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence item not found")

    # Record view in audit log
    AuditService.log(
        db=db,
        action=AuditAction.EVIDENCE_VIEW,
        resource_type="evidence",
        resource_id=ev.id,
        investigation_id=ev.investigation_id,
        user=current_user,
        details={"filename": ev.original_filename}
    )

    jobs = [ProcessingJobResponse.model_validate(j) for j in ev.processing_jobs]
    meta = EvidenceMetadataResponse.model_validate(ev.metadata_record) if ev.metadata_record else None
    from app.schemas.finding import FindingResponse
    findings = [FindingResponse.model_validate(f) for f in ev.findings]

    return EvidenceDetailResponse(
        id=ev.id,
        investigation_id=ev.investigation_id,
        title=ev.title,
        original_filename=ev.original_filename,
        mime_type=ev.mime_type,
        file_size=ev.file_size,
        sha256_hash=ev.sha256_hash,
        status=ev.status,
        processing_stage=ev.processing_stage,
        uploaded_by_id=ev.uploaded_by_id,
        created_at=ev.created_at,
        updated_at=ev.updated_at,
        uploaded_by=ev.uploaded_by,
        metadata_record=meta,
        processing_jobs=jobs,
        findings=findings
    )

@router.get("/evidence/{evidence_id}/file")
def get_evidence_file(
    evidence_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ev = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence item not found")

    file_path = ev.storage_path
    if not os.path.isabs(file_path):
        from app.config import BASE_DIR
        file_path = os.path.normpath(os.path.join(BASE_DIR, file_path))

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Evidence file not found in storage vault")

    # Defense-in-depth path traversal prevention
    real_file_path = os.path.realpath(file_path)
    real_storage_boundary = os.path.realpath(settings.STORAGE_PATH)
    if not real_file_path.startswith(real_storage_boundary):
        raise HTTPException(status_code=403, detail="Security violation: path traversal detected")

    return FileResponse(
        path=real_file_path,
        media_type=ev.mime_type,
        filename=ev.original_filename
    )

@router.post("/evidence/{evidence_id}/reprocess")
async def reprocess_evidence(
    evidence_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ev = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")

    success = await PipelineService.process_evidence(db, ev.id, user=current_user)
    if not success:
        raise HTTPException(status_code=500, detail="Evidence reprocessing failed")
    
    db.refresh(ev)
    return {"status": "success", "message": "Evidence successfully reprocessed", "stage": ev.processing_stage.value}
