from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.audit import AuditAction

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    investigation_id: Optional[str] = None
    action: AuditAction
    resource_type: str
    resource_id: Optional[str] = None
    details_json: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime
