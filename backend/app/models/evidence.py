import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class EvidenceStatus(str, Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    ANALYZED = "ANALYZED"
    ERROR = "ERROR"

class ProcessingStage(str, Enum):
    UPLOADED = "UPLOADED"
    HASHING = "HASHING"
    METADATA = "METADATA"
    TEXT_OCR = "TEXT_OCR"
    ENTITY_EXTRACTION = "ENTITY_EXTRACTION"
    AI_ANALYSIS = "AI_ANALYSIS"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"

class JobStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    storage_path = Column(String(512), nullable=False)
    mime_type = Column(String(128), nullable=False)
    file_size = Column(Integer, nullable=False)
    sha256_hash = Column(String(64), index=True, nullable=False)
    status = Column(SQLEnum(EvidenceStatus), default=EvidenceStatus.UPLOADED, nullable=False, index=True)
    processing_stage = Column(SQLEnum(ProcessingStage), default=ProcessingStage.UPLOADED, nullable=False)
    uploaded_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    investigation = relationship("Investigation", back_populates="evidence_items")
    uploaded_by = relationship("User")
    metadata_record = relationship("EvidenceMetadata", back_populates="evidence", uselist=False, cascade="all, delete-orphan")
    processing_jobs = relationship("ProcessingJob", back_populates="evidence", cascade="all, delete-orphan")
    timeline_events = relationship("TimelineEvent", back_populates="evidence")
    findings = relationship("Finding", back_populates="evidence")

class EvidenceMetadata(Base):
    __tablename__ = "evidence_metadata"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evidence_id = Column(String(36), ForeignKey("evidence.id", ondelete="CASCADE"), unique=True, nullable=False)
    file_format = Column(String(64), nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    created_date = Column(String(64), nullable=True)
    device_make = Column(String(128), nullable=True)
    device_model = Column(String(128), nullable=True)
    gps_latitude = Column(Float, nullable=True)
    gps_longitude = Column(Float, nullable=True)
    author = Column(String(255), nullable=True)
    page_count = Column(Integer, nullable=True)
    extracted_text = Column(Text, nullable=True)
    authenticity_score = Column(Float, nullable=True)  # Heuristic score 0.0 - 1.0
    authenticity_notes = Column(Text, nullable=True)
    raw_metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    evidence = relationship("Evidence", back_populates="metadata_record")

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evidence_id = Column(String(36), ForeignKey("evidence.id", ondelete="CASCADE"), nullable=False, index=True)
    stage = Column(SQLEnum(ProcessingStage), nullable=False)
    status = Column(SQLEnum(JobStatus), default=JobStatus.PENDING, nullable=False)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    evidence = relationship("Evidence", back_populates="processing_jobs")
