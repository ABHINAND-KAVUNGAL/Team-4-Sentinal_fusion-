from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.investigations import InvestigationStatus, Priority
from app.schemas.auth import UserResponse

class InvestigationCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Priority = Priority.MEDIUM

class InvestigationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[InvestigationStatus] = None
    priority: Optional[Priority] = None

class InvestigationMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    role_in_case: str
    assigned_at: datetime
    user: UserResponse

class InvestigationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_number: str
    title: str
    description: Optional[str] = None
    status: InvestigationStatus
    priority: Priority
    lead_investigator_id: str
    created_at: datetime
    updated_at: datetime
    evidence_count: int = 0
    findings_count: int = 0
    risk_score: int = 0

class InvestigationDetailResponse(InvestigationResponse):
    lead_investigator: UserResponse
    members: List[InvestigationMemberResponse] = []
