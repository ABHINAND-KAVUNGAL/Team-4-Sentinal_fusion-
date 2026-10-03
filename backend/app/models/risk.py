import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Integer, Text, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class RiskTier(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    overall_score = Column(Integer, default=0, nullable=False)  # 0 to 100
    risk_tier = Column(SQLEnum(RiskTier), default=RiskTier.LOW, nullable=False)
    factors_json = Column(Text, nullable=False)  # Detailed factors breakdown with points & reasons
    assessment_mode = Column(String(64), default="HEURISTIC_EXPLAINABLE", nullable=False)
    calculated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    investigation = relationship("Investigation", back_populates="risk_assessments")
