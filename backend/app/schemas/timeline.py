from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.timeline import EventCategory

class TimelineEventCreate(BaseModel):
    timestamp: datetime
    title: str
    description: Optional[str] = None
    category: EventCategory = EventCategory.GENERAL
    confidence: float = 1.0
    evidence_id: Optional[str] = None
    is_demo: bool = False

class TimelineEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    investigation_id: str
    evidence_id: Optional[str] = None
    timestamp: datetime
    title: str
    description: Optional[str] = None
    category: EventCategory
    confidence: float
    is_demo: bool
    created_at: datetime
    evidence_title: Optional[str] = None
