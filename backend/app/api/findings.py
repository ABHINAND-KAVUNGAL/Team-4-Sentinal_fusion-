from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.users import User
from app.models.investigations import Investigation
from app.models.findings import Finding, FindingSeverity, ReviewStatus
from app.models.audit import AuditAction
from app.schemas.finding import FindingResponse, FindingReviewRequest
from app.services.audit_service import AuditService
from app.services.risk_service import RiskService
from app.api.deps import get_current_user

router = APIRouter(tags=["AI Findings"])

def _format_finding(f: Finding) -> FindingResponse:
    resp = FindingResponse.model_validate(f)
    if f.evidence:
        resp.evidence_title = f.evidence.title
    return resp

@router.get("/investigations/{investigation_id}/findings", response_model=List[FindingResponse])
def get_investigation_findings(
    investigation_id: str,
    severity: Optional[FindingSeverity] = Query(None),
    review_status: Optional[ReviewStatus] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    query = db.query(Finding).filter(Finding.investigation_id == investigation_id)
    if severity:
        query = query.filter(Finding.severity == severity)
    if review_status:
        query = query.filter(Finding.review_status == review_status)

    findings = query.order_by(Finding.created_at.desc()).all()
    return [_format_finding(f) for f in findings]

@router.patch("/findings/{finding_id}/review", response_model=FindingResponse)
def review_finding(
    finding_id: str,
    review_data: FindingReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    old_status = finding.review_status
    finding.review_status = review_data.review_status
    finding.review_notes = review_data.review_notes
    finding.reviewed_by_id = current_user.id
    finding.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(finding)

    # Recalculate case risk
    RiskService.calculate_investigation_risk(db, finding.investigation_id)

    # Audit log
    AuditService.log(
        db=db,
        action=AuditAction.FINDING_REVIEW,
        resource_type="finding",
        resource_id=finding.id,
        investigation_id=finding.investigation_id,
        user=current_user,
        details={
            "old_status": old_status.value,
            "new_status": finding.review_status.value,
            "title": finding.title,
            "notes": review_data.review_notes
        }
    )

    return _format_finding(finding)
