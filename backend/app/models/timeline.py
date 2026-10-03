import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Float, Text, DateTime, Boolean, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class EventCategory(str, Enum):
    COMMUNICATION = "COMMUNICATION"
    TRANSACTION = "TRANSACTION"
    LOCATION = "LOCATION"
    ACCESS = "ACCESS"
    MEDIA = "MEDIA"
    GENERAL = "GENERAL"

class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    evidence_id = Column(String(36), ForeignKey("evidence.id", ondelete="SET NULL"), nullable=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(SQLEnum(EventCategory), default=EventCategory.GENERAL, nullable=False, index=True)
    confidence = Column(Float, default=1.0, nullable=False)
    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    investigation = relationship("Investigation", back_populates="timeline_events")
    evidence = relationship("Evidence", back_populates="timeline_events")
