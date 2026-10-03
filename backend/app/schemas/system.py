from typing import Dict, Any, Optional
from pydantic import BaseModel

class SystemServiceStatus(BaseModel):
    name: str
    status: str  # OPERATIONAL, AVAILABLE, UNAVAILABLE, DEMO_MODE
    details: Optional[str] = None

class SystemStatusResponse(BaseModel):
    database: SystemServiceStatus
    backend: SystemServiceStatus
    storage: SystemServiceStatus
    ocr_engine: SystemServiceStatus
    ai_provider: SystemServiceStatus
    demo_mode: bool
    version: str
