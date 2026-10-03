import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Integer, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ReportFormat(str, Enum):
    PDF = "PDF"
    JSON = "JSON"

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    format = Column(SQLEnum(ReportFormat), default=ReportFormat.PDF, nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, default=0, nullable=False)
    generated_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    investigation = relationship("Investigation", back_populates="reports")
    generated_by = relationship("User")
