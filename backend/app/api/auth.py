from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.users import User
from app.models.audit import AuditAction
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.utils.security import verify_password, create_access_token
from app.services.audit_service import AuditService
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )

    access_token = create_access_token(subject=user.id)
    
    # Audit log
    client_ip = request.client.host if request.client else None
    AuditService.log(
        db=db,
        action=AuditAction.LOGIN,
        resource_type="user",
        resource_id=user.id,
        user=user,
        details={"email": user.email, "role": user.role.value},
        ip_address=client_ip
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/logout")
def logout(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else None
    AuditService.log(
        db=db,
        action=AuditAction.LOGOUT,
        resource_type="user",
        resource_id=current_user.id,
        user=current_user,
        details={"email": current_user.email},
        ip_address=client_ip
    )
    return {"status": "success", "message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
