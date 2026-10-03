from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.findings import FindingSeverity, ReviewStatus
from app.schemas.auth import UserResponse

class FindingReviewRequest(BaseModel):
    review_status: ReviewStatus
    review_notes: Optional[str] = None

class FindingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    investigation_id: str
    evidence_id: Optional[str] = None
    title: str
    summary: str
    severity: FindingSeverity
    confidence: float
    review_status: ReviewStatus
    reviewed_by_id: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    explanation: Optional[str] = None
    analysis_mode: str
    created_at: datetime
    evidence_title: Optional[str] = None
    reviewed_by: Optional[UserResponse] = None
