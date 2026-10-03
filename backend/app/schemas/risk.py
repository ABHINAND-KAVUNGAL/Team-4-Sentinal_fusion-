from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ConfigDict
from app.models.risk import RiskTier

class RiskFactor(BaseModel):
    name: str
    weight: int
    score: int
    description: str
    evidence_ids: List[str] = []

class RiskAssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    investigation_id: str
    overall_score: int
    risk_tier: RiskTier
    factors: List[RiskFactor]
    assessment_mode: str
    calculated_at: datetime
