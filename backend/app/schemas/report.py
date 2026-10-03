from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.reports import ReportFormat
from app.schemas.auth import UserResponse

class ReportCreate(BaseModel):
    title: Optional[str] = None
    format: ReportFormat = ReportFormat.PDF
    include_timeline: bool = True
    include_findings: bool = True
    include_evidence: bool = True
    include_risk: bool = True

class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    investigation_id: str
    title: str
    format: ReportFormat
    file_size: int
    generated_by_id: str
    created_at: datetime
    generated_by: Optional[UserResponse] = None
