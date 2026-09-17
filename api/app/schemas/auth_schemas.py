from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: "UserOut"


class UserCreate(BaseModel):
    username: str
    full_name: str
    password: str
    role: str = "technician"


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserOut(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogOut(BaseModel):
    id: int
    user_id: int
    action: str
    detail: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    username: Optional[str] = None

    class Config:
        from_attributes = True


LoginResponse.model_rebuild()
