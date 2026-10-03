from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.users import Role

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: Role
    is_active: bool
    created_at: datetime

TokenResponse.model_rebuild()
