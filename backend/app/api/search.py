from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.users import User
from app.models.investigations import Investigation
from app.models.evidence import Evidence
from app.models.entities import Entity
from app.models.findings import Finding
from app.api.deps import get_current_user

router = APIRouter(prefix="/search", tags=["Global Search"])

@router.get("")
def global_search(
    q: str = Query(..., min_length=2, description="Query string"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, List[Dict[str, Any]]]:
    term = f"%{q}%"

    # Search Investigations
    invs = db.query(Investigation).filter(
        or_(Investigation.title.ilike(term), Investigation.case_number.ilike(term), Investigation.description.ilike(term))
    ).limit(8).all()
    inv_results = [
        {"id": i.id, "case_number": i.case_number, "title": i.title, "status": i.status.value, "priority": i.priority.value}
        for i in invs
    ]

    # Search Evidence
    evs = db.query(Evidence).filter(
        or_(Evidence.title.ilike(term), Evidence.original_filename.ilike(term), Evidence.sha256_hash.ilike(term))
    ).limit(8).all()
    ev_results = [
        {"id": e.id, "investigation_id": e.investigation_id, "title": e.title, "filename": e.original_filename, "hash": e.sha256_hash[:12]}
        for e in evs
    ]

    # Search Entities
    entities = db.query(Entity).filter(Entity.name.ilike(term)).limit(8).all()
    ent_results = [
        {"id": ent.id, "investigation_id": ent.investigation_id, "name": ent.name, "category": ent.category.value, "risk_score": ent.risk_score}
        for ent in entities
    ]

    # Search Findings
    findings = db.query(Finding).filter(
        or_(Finding.title.ilike(term), Finding.summary.ilike(term))
    ).limit(8).all()
    find_results = [
        {"id": f.id, "investigation_id": f.investigation_id, "title": f.title, "severity": f.severity.value, "review_status": f.review_status.value}
        for f in findings
    ]

    return {
        "investigations": inv_results,
        "evidence": ev_results,
        "entities": ent_results,
        "findings": find_results
    }
