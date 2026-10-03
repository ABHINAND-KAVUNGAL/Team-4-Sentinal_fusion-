from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.models.evidence import EvidenceStatus, ProcessingStage, JobStatus
from app.schemas.auth import UserResponse

class ProcessingJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    evidence_id: str
    stage: ProcessingStage
    status: JobStatus
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None

class EvidenceMetadataResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    evidence_id: str
    file_format: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    created_date: Optional[str] = None
    device_make: Optional[str] = None
    device_model: Optional[str] = None
    gps_latitude: Optional[float] = None
    gps_longitude: Optional[float] = None
    author: Optional[str] = None
    page_count: Optional[int] = None
    extracted_text: Optional[str] = None
    authenticity_score: Optional[float] = None
    authenticity_notes: Optional[str] = None
    raw_metadata_json: Optional[str] = None
    created_at: datetime

class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    investigation_id: str
    title: str
    original_filename: str
    mime_type: str
    file_size: int
    sha256_hash: str
    status: EvidenceStatus
    processing_stage: ProcessingStage
    uploaded_by_id: str
    created_at: datetime
    updated_at: datetime

from app.schemas.finding import FindingResponse

class EvidenceDetailResponse(EvidenceResponse):
    uploaded_by: UserResponse
    metadata_record: Optional[EvidenceMetadataResponse] = None
    processing_jobs: List[ProcessingJobResponse] = []
    findings: List[FindingResponse] = []
