import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.config import settings
from app.schemas.system import SystemStatusResponse, SystemServiceStatus
from app.services.ocr_service import OCRService
from app.providers.factory import get_ai_provider

router = APIRouter(prefix="/system", tags=["System Diagnostics"])

@router.get("/status", response_model=SystemStatusResponse)
async def get_system_status(db: Session = Depends(get_db)):
    # 1. Database Check
    db_status = "OPERATIONAL"
    db_details = f"Connected ({settings.DATABASE_URL.split('://')[0]})"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = "UNAVAILABLE"
        db_details = str(e)

    # 2. Backend Check
    be_status = "OPERATIONAL"
    be_details = f"FastAPI v{settings.VERSION} running"

    # 3. Storage Vault Check
    st_status = "OPERATIONAL"
    st_details = f"Storage path: {settings.STORAGE_PATH}"
    if not os.path.exists(settings.STORAGE_PATH):
        try:
            os.makedirs(settings.STORAGE_PATH, exist_ok=True)
        except Exception as e:
            st_status = "UNAVAILABLE"
            st_details = str(e)

    # 4. OCR Engine Check
    ocr_avail = OCRService.is_tesseract_available()
    ocr_status = "AVAILABLE" if ocr_avail else "UNAVAILABLE"
    ocr_details = "Tesseract binary detected" if ocr_avail else "Tesseract binary not installed (Direct document text extraction active)"

    # 5. AI Provider Check
    ai_provider = await get_ai_provider()
    ai_avail = await ai_provider.is_available()
    ai_status = "OPERATIONAL" if ai_avail else "UNAVAILABLE"
    ai_details = f"{ai_provider.get_provider_name()}"

    return SystemStatusResponse(
        database=SystemServiceStatus(name="Database", status=db_status, details=db_details),
        backend=SystemServiceStatus(name="Backend Service", status=be_status, details=be_details),
        storage=SystemServiceStatus(name="Evidence Vault Storage", status=st_status, details=st_details),
        ocr_engine=SystemServiceStatus(name="OCR Engine", status=ocr_status, details=ocr_details),
        ai_provider=SystemServiceStatus(name="AI Provider", status=ai_status, details=ai_details),
        demo_mode=settings.DEMO_MODE,
        version=settings.VERSION
    )
