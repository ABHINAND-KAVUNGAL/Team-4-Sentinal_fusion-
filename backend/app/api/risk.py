from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.users import User
from app.models.investigations import Investigation
from app.schemas.risk import RiskAssessmentResponse
from app.services.risk_service import RiskService
from app.api.deps import get_current_user

router = APIRouter(tags=["Investigative Risk"])

@router.get("/investigations/{investigation_id}/risk", response_model=RiskAssessmentResponse)
def get_investigation_risk(
    investigation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    risk_data = RiskService.calculate_investigation_risk(db, investigation_id)
    return risk_data
