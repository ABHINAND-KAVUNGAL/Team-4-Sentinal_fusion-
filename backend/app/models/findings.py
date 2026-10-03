import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Float, Text, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class FindingSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ReviewStatus(str, Enum):
    NEW = "NEW"
    REVIEWED = "REVIEWED"
    CONFIRMED = "CONFIRMED"
    DISMISSED = "DISMISSED"

class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    evidence_id = Column(String(36), ForeignKey("evidence.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    severity = Column(SQLEnum(FindingSeverity), default=FindingSeverity.MEDIUM, nullable=False, index=True)
    confidence = Column(Float, default=0.85, nullable=False)
    review_status = Column(SQLEnum(ReviewStatus), default=ReviewStatus.NEW, nullable=False, index=True)
    reviewed_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    analysis_mode = Column(String(64), default="DEMO_ANALYSIS", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    investigation = relationship("Investigation", back_populates="findings")
    evidence = relationship("Evidence", back_populates="findings")
    reviewed_by = relationship("User")
