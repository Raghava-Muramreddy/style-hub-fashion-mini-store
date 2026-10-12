from __future__ import annotations

from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User


def register_user(db: Session, full_name: str, email: str, password: str) -> User:
    normalized_email = email.lower().strip()
    existing = db.scalar(select(User).where(User.email == normalized_email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(full_name=full_name.strip(), email=normalized_email, password_hash=get_password_hash(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    normalized_email = email.lower().strip()
    user = db.scalar(select(User).where(User.email == normalized_email))
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


def create_user_token(user: User) -> str:
    return create_access_token(
        subject=str(user.id),
        token_id=f"token-{user.id}-{user.email}",
        expires_delta=timedelta(minutes=settings.jwt_access_token_expire_minutes),
    )
