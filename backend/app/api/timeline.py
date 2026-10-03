from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.users import User
from app.models.investigations import Investigation
from app.models.timeline import TimelineEvent, EventCategory
from app.models.audit import AuditAction
from app.schemas.timeline import TimelineEventCreate, TimelineEventResponse
from app.services.audit_service import AuditService
from app.api.deps import get_current_user

router = APIRouter(tags=["Investigation Timeline"])

@router.get("/investigations/{investigation_id}/timeline", response_model=List[TimelineEventResponse])
def get_investigation_timeline(
    investigation_id: str,
    category: Optional[EventCategory] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    query = db.query(TimelineEvent).filter(TimelineEvent.investigation_id == investigation_id)
    if category:
        query = query.filter(TimelineEvent.category == category)

    events = query.order_by(TimelineEvent.timestamp.asc()).all()
    results = []
    for ev in events:
        resp = TimelineEventResponse.model_validate(ev)
        if ev.evidence:
            resp.evidence_title = ev.evidence.title
        results.append(resp)
    return results

@router.post("/investigations/{investigation_id}/timeline", response_model=TimelineEventResponse, status_code=status.HTTP_201_CREATED)
def create_timeline_event(
    investigation_id: str,
    event_data: TimelineEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    event = TimelineEvent(
        investigation_id=investigation_id,
        evidence_id=event_data.evidence_id,
        timestamp=event_data.timestamp,
        title=event_data.title,
        description=event_data.description,
        category=event_data.category,
        confidence=event_data.confidence,
        is_demo=event_data.is_demo
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    AuditService.log(
        db=db,
        action=AuditAction.TIMELINE_CREATE,
        resource_type="timeline_event",
        resource_id=event.id,
        investigation_id=investigation_id,
        user=current_user,
        details={"title": event.title, "timestamp": event.timestamp.isoformat()}
    )

    resp = TimelineEventResponse.model_validate(event)
    if event.evidence:
        resp.evidence_title = event.evidence.title
    return resp
