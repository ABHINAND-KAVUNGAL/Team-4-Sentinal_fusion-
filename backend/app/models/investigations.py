import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class InvestigationStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    REVIEW = "REVIEW"
    CLOSED = "CLOSED"

class Priority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_number = Column(String(64), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(InvestigationStatus), default=InvestigationStatus.ACTIVE, nullable=False, index=True)
    priority = Column(SQLEnum(Priority), default=Priority.MEDIUM, nullable=False, index=True)
    lead_investigator_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    lead_investigator = relationship("User", back_populates="led_investigations")
    members = relationship("InvestigationMember", back_populates="investigation", cascade="all, delete-orphan")
    evidence_items = relationship("Evidence", back_populates="investigation", cascade="all, delete-orphan")
    entities = relationship("Entity", back_populates="investigation", cascade="all, delete-orphan")
    relationships = relationship("Relationship", back_populates="investigation", cascade="all, delete-orphan")
    timeline_events = relationship("TimelineEvent", back_populates="investigation", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="investigation", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="investigation", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="investigation", cascade="all, delete-orphan")

class InvestigationMember(Base):
    __tablename__ = "investigation_members"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    role_in_case = Column(String(64), default="Investigator", nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    investigation = relationship("Investigation", back_populates="members")
    user = relationship("User")
