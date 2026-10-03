import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.users import User
from app.models.investigations import Investigation
from app.models.reports import Report, ReportFormat
from app.schemas.report import ReportCreate, ReportResponse
from app.services.report_service import ReportService
from app.api.deps import get_current_user
from app.config import settings

router = APIRouter(tags=["Reports & Dossiers"])

@router.get("/investigations/{investigation_id}/reports", response_model=List[ReportResponse])
def list_investigation_reports(
    investigation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    reports = db.query(Report).filter(Report.investigation_id == investigation_id).order_by(Report.created_at.desc()).all()
    return reports

@router.post("/investigations/{investigation_id}/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def generate_investigation_report(
    investigation_id: str,
    report_data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    report = ReportService.generate_report(
        db=db,
        investigation_id=investigation_id,
        user=current_user,
        format_type=report_data.format,
        title=report_data.title
    )
    return report

@router.get("/reports/{report_id}/download")
def download_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report dossier file not found")

    file_path = report.file_path
    if not os.path.isabs(file_path):
        from app.config import BASE_DIR
        file_path = os.path.normpath(os.path.join(BASE_DIR, file_path))

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report dossier file not found")

    # Defense-in-depth path traversal prevention
    real_file_path = os.path.realpath(file_path)
    real_storage_boundary = os.path.realpath(settings.STORAGE_PATH)
    if not real_file_path.startswith(real_storage_boundary):
        raise HTTPException(status_code=403, detail="Security violation: path traversal detected")

    media_type = "application/pdf" if report.format == ReportFormat.PDF else "application/json"
    filename = f"{report.title}.{'pdf' if report.format == ReportFormat.PDF else 'json'}"

    return FileResponse(
        path=real_file_path,
        media_type=media_type,
        filename=filename
    )
