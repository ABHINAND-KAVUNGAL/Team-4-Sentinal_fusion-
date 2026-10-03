import random
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.users import User
from app.models.investigations import Investigation, InvestigationStatus, Priority, InvestigationMember
from app.models.evidence import Evidence
from app.models.findings import Finding
from app.models.risk import RiskAssessment
from app.models.audit import AuditAction
from app.schemas.investigation import (
    InvestigationCreate, InvestigationUpdate, InvestigationResponse, InvestigationDetailResponse
)
from app.services.audit_service import AuditService
from app.services.risk_service import RiskService
from app.api.deps import get_current_user

router = APIRouter(prefix="/investigations", tags=["Investigations"])

def _format_investigation_response(inv: Investigation, db: Session) -> InvestigationResponse:
    ev_count = db.query(Evidence).filter(Evidence.investigation_id == inv.id).count()
    f_count = db.query(Finding).filter(Finding.investigation_id == inv.id).count()
    risk = db.query(RiskAssessment).filter(RiskAssessment.investigation_id == inv.id).first()
    risk_score = risk.overall_score if risk else 0

    return InvestigationResponse(
        id=inv.id,
        case_number=inv.case_number,
        title=inv.title,
        description=inv.description,
        status=inv.status,
        priority=inv.priority,
        lead_investigator_id=inv.lead_investigator_id,
        created_at=inv.created_at,
        updated_at=inv.updated_at,
        evidence_count=ev_count,
        findings_count=f_count,
        risk_score=risk_score
    )

@router.get("", response_model=List[InvestigationResponse])
@router.get("/", response_model=List[InvestigationResponse], include_in_schema=False)
def list_investigations(

    q: Optional[str] = Query(None, description="Search term for case title or number"),
    status: Optional[InvestigationStatus] = Query(None, description="Filter by case status"),
    priority: Optional[Priority] = Query(None, description="Filter by priority"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Investigation)
    if q:
        query = query.filter(or_(
            Investigation.title.ilike(f"%{q}%"),
            Investigation.case_number.ilike(f"%{q}%"),
            Investigation.description.ilike(f"%{q}%")
        ))
    if status:
        query = query.filter(Investigation.status == status)
    if priority:
        query = query.filter(Investigation.priority == priority)

    investigations = query.order_by(Investigation.updated_at.desc()).all()
    return [_format_investigation_response(inv, db) for inv in investigations]

@router.post("", response_model=InvestigationDetailResponse, status_code=status.HTTP_201_CREATED)
def create_investigation(
    inv_data: InvestigationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Generate sequential or unique case number: SF-2026-XXX
    count = db.query(Investigation).count() + 1
    while db.query(Investigation).filter(Investigation.case_number == f"SF-2026-{count:03d}").first():
        count += 1
    case_number = f"SF-2026-{count:03d}"

    inv = Investigation(
        case_number=case_number,
        title=inv_data.title,
        description=inv_data.description,
        status=InvestigationStatus.ACTIVE,
        priority=inv_data.priority,
        lead_investigator_id=current_user.id
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    # Add creator as Lead Investigator member
    member = InvestigationMember(
        investigation_id=inv.id,
        user_id=current_user.id,
        role_in_case="Lead Investigator"
    )
    db.add(member)
    db.commit()

    # Initial risk calculation
    RiskService.calculate_investigation_risk(db, inv.id)

    # Audit log
    AuditService.log(
        db=db,
        action=AuditAction.CASE_CREATE,
        resource_type="investigation",
        resource_id=inv.id,
        investigation_id=inv.id,
        user=current_user,
        details={"case_number": case_number, "title": inv.title}
    )

    db.refresh(inv)
    resp = _format_investigation_response(inv, db)
    return InvestigationDetailResponse(
        **resp.model_dump(),
        lead_investigator=inv.lead_investigator,
        members=inv.members
    )

@router.get("/{id}", response_model=InvestigationDetailResponse)
def get_investigation(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investigation).filter(Investigation.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    resp = _format_investigation_response(inv, db)
    return InvestigationDetailResponse(
        **resp.model_dump(),
        lead_investigator=inv.lead_investigator,
        members=inv.members
    )

@router.patch("/{id}", response_model=InvestigationResponse)
def update_investigation(
    id: str,
    inv_update: InvestigationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investigation).filter(Investigation.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    changes = {}
    if inv_update.title is not None:
        changes["title"] = (inv.title, inv_update.title)
        inv.title = inv_update.title
    if inv_update.description is not None:
        changes["description"] = (inv.description, inv_update.description)
        inv.description = inv_update.description
    if inv_update.status is not None:
        changes["status"] = (inv.status.value, inv_update.status.value)
        inv.status = inv_update.status
    if inv_update.priority is not None:
        changes["priority"] = (inv.priority.value, inv_update.priority.value)
        inv.priority = inv_update.priority

    inv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(inv)

    AuditService.log(
        db=db,
        action=AuditAction.CASE_UPDATE,
        resource_type="investigation",
        resource_id=inv.id,
        investigation_id=inv.id,
        user=current_user,
        details=changes
    )

    return _format_investigation_response(inv, db)
