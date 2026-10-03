import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class AuditAction(str, Enum):
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    CASE_CREATE = "CASE_CREATE"
    CASE_UPDATE = "CASE_UPDATE"
    EVIDENCE_UPLOAD = "EVIDENCE_UPLOAD"
    EVIDENCE_PROCESS = "EVIDENCE_PROCESS"
    EVIDENCE_VIEW = "EVIDENCE_VIEW"
    FINDING_REVIEW = "FINDING_REVIEW"
    REPORT_GENERATE = "REPORT_GENERATE"
    ENTITY_CREATE = "ENTITY_CREATE"
    RELATIONSHIP_CREATE = "RELATIONSHIP_CREATE"
    TIMELINE_CREATE = "TIMELINE_CREATE"

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    user_email = Column(String(255), nullable=True)
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=True, index=True)
    action = Column(SQLEnum(AuditAction), nullable=False, index=True)
    resource_type = Column(String(64), nullable=False)
    resource_id = Column(String(64), nullable=True)
    details_json = Column(Text, nullable=True)
    ip_address = Column(String(64), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="audit_logs")
    investigation = relationship("Investigation")
