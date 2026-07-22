from sqlalchemy.orm import Session

import models


def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> models.User | None:
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(db: Session, email: str, password_hash: str, role: str,
                 full_name: str = None, facility_id: int = None, patient_id: int = None) -> models.User:
    new_user = models.User(
        email=email,
        password_hash=password_hash,
        role=role,
        full_name=full_name,
        facility_id=facility_id,
        patient_id=patient_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

import secrets
from datetime import datetime, timedelta


def create_password_reset_token(db: Session, user_id: int) -> models.PasswordResetToken:
    token = secrets.token_urlsafe(32)
    reset_token = models.PasswordResetToken(
        user_id=user_id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(minutes=30)
    )
    db.add(reset_token)
    db.commit()
    db.refresh(reset_token)
    return reset_token


def get_valid_reset_token(db: Session, token: str) -> models.PasswordResetToken | None:
    reset_token = db.query(models.PasswordResetToken).filter(models.PasswordResetToken.token == token).first()
    if not reset_token:
        return None
    if reset_token.used or reset_token.expires_at < datetime.utcnow():
        return None
    return reset_token


def mark_token_used(db: Session, reset_token: models.PasswordResetToken):
    reset_token.used = True
    db.commit()


def update_user_password(db: Session, user: models.User, new_password_hash: str):
    user.password_hash = new_password_hash
    db.commit()