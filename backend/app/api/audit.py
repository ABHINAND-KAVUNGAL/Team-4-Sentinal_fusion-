from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.users import User
from app.models.audit import AuditLog, AuditAction
from app.schemas.audit import AuditLogResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/audit", tags=["Audit Log"])

@router.get("", response_model=List[AuditLogResponse])
@router.get("/", response_model=List[AuditLogResponse], include_in_schema=False)
def get_audit_trail(

    investigation_id: Optional[str] = Query(None),
    action: Optional[AuditAction] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AuditLog)
    if investigation_id:
        query = query.filter(AuditLog.investigation_id == investigation_id)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return logs
