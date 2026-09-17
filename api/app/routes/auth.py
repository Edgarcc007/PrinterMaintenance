from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, AuditLog, UserRole
from app.schemas.auth_schemas import (
    LoginRequest, LoginResponse, UserCreate, UserUpdate, UserOut, AuditLogOut
)
import hashlib
import secrets
import time
from typing import List

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Simple token store (in production use JWT/Redis)
_tokens: dict[str, dict] = {}


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token or token not in _tokens:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = _tokens[token]["user_id"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User inactive or not found")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def log_action(db: Session, user_id: int, action: str, detail: str, ip: str = None):
    entry = AuditLog(user_id=user_id, action=action, detail=detail, ip_address=ip)
    db.add(entry)
    db.commit()


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ── Login / Logout ──────────────────────────────────

@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or user.password_hash != hash_password(body.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    token = secrets.token_hex(32)
    _tokens[token] = {"user_id": user.id, "created": time.time()}

    ip = get_client_ip(request)
    log_action(db, user.id, "LOGIN", "Login successful", ip)

    return LoginResponse(
        token=token,
        user=UserOut.model_validate(user)
    )


@router.post("/logout")
def logout(request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    _tokens.pop(token, None)
    log_action(db, user.id, "LOGOUT", "Logout", get_client_ip(request))
    return {"ok": True}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


# ── User Management (admin) ─────────────────────────

@router.get("/users", response_model=List[UserOut])
def list_users(user: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.post("/users", response_model=UserOut)
def create_user(body: UserCreate, request: Request,
                user: User = Depends(require_admin), db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    new_user = User(
        username=body.username,
        full_name=body.full_name,
        password_hash=hash_password(body.password),
        role=UserRole(body.role)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    log_action(db, user.id, "CREATE_USER", f"Created user: {body.username}", get_client_ip(request))
    return new_user


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, body: UserUpdate, request: Request,
                user: User = Depends(require_admin), db: Session = Depends(get_db)):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if body.full_name is not None:
        target.full_name = body.full_name
    if body.role is not None:
        target.role = UserRole(body.role)
    if body.is_active is not None:
        target.is_active = body.is_active
    if body.password is not None:
        target.password_hash = hash_password(body.password)
    db.commit()
    db.refresh(target)
    log_action(db, user.id, "UPDATE_USER", f"Updated user: {target.username}", get_client_ip(request))
    return target


@router.delete("/users/{user_id}")
def delete_user(user_id: int, request: Request,
                user: User = Depends(require_admin), db: Session = Depends(get_db)):
    if user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    username = target.username
    db.delete(target)
    db.commit()
    log_action(db, user.id, "DELETE_USER", f"Deleted user: {username}", get_client_ip(request))
    return {"ok": True}


# ── Audit Log ────────────────────────────────────────

@router.get("/audit", response_model=List[AuditLogOut])
def get_audit_log(limit: int = 50, user: User = Depends(require_admin),
                  db: Session = Depends(get_db)):
    logs = (
        db.query(AuditLog)
        .join(User)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
    result = []
    for log in logs:
        out = AuditLogOut.model_validate(log)
        out.username = log.user.username
        result.append(out)
    return result
