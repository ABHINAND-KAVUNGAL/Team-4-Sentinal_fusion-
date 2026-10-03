import json
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models.audit import AuditLog, AuditAction
from app.models.users import User

class AuditService:
    @staticmethod
    def log(
        db: Session,
        action: AuditAction,
        resource_type: str,
        resource_id: Optional[str] = None,
        investigation_id: Optional[str] = None,
        user: Optional[User] = None,
        details: Optional[Any] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """
        Record an immutable, append-only forensic audit entry.
        """
        details_str = json.dumps(details) if isinstance(details, (dict, list)) else (str(details) if details else None)
        
        entry = AuditLog(
            user_id=user.id if user else None,
            user_email=user.email if user else "system",
            investigation_id=investigation_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            details_json=details_str,
            ip_address=ip_address
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry
