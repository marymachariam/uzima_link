from datetime import datetime, timedelta
from uuid import UUID
from sqlalchemy.orm import Session

import app.models as models


def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_id(db: Session, user_id: UUID) -> models.User | None:
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_patient_id(db: Session, patient_id: UUID) -> models.User | None:
    return db.query(models.User).filter(models.User.patient_id == patient_id).first()


def create_user(db: Session, email: str, password_hash: str, role: str,
                 full_name: str = None, facility_id: UUID = None, patient_id: UUID = None,
                 is_verified: bool = False) -> models.User:
    new_user = models.User(
        email=email,
        password_hash=password_hash,
        role=role,
        full_name=full_name,
        facility_id=facility_id,
        patient_id=patient_id,
        is_verified=is_verified,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def mark_user_verified(db: Session, user: models.User):
    user.is_verified = True
    db.commit()


def update_user_password(db: Session, user: models.User, new_password_hash: str):
    user.password_hash = new_password_hash
    db.commit()


def update_user_profile(db: Session, user: models.User, full_name: str = None,
                         specialty: str = None, photo_url: str = None) -> models.User:
    if full_name is not None:
        user.full_name = full_name
    if specialty is not None:
        user.specialty = specialty
    if photo_url is not None:
        user.photo_url = photo_url
    db.commit()
    db.refresh(user)
    return user


# --- Password reset: DB-backed opaque token ---

def set_reset_token(db: Session, user: models.User, token: str, expires_minutes: int = 15) -> models.User:
    user.reset_token = token
    user.reset_token_expires_at = datetime.utcnow() + timedelta(minutes=expires_minutes)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_reset_token(db: Session, token: str) -> models.User | None:
    user = db.query(models.User).filter(models.User.reset_token == token).first()
    if not user:
        return None
    if not user.reset_token_expires_at or user.reset_token_expires_at < datetime.utcnow():
        return None
    return user


def clear_reset_token(db: Session, user: models.User):
    user.reset_token = None
    user.reset_token_expires_at = None
    db.commit()


# --- Email verification: DB-backed opaque token ---

def set_email_verification_token(db: Session, user: models.User, token: str, expires_hours: int = 24) -> models.User:
    user.email_verification_token = token
    user.email_verification_expires_at = datetime.utcnow() + timedelta(hours=expires_hours)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_verification_token(db: Session, token: str) -> models.User | None:
    user = db.query(models.User).filter(models.User.email_verification_token == token).first()
    if not user:
        return None
    if not user.email_verification_expires_at or user.email_verification_expires_at < datetime.utcnow():
        return None
    return user


def clear_email_verification_token(db: Session, user: models.User):
    user.email_verification_token = None
    user.email_verification_expires_at = None
    db.commit()
    

# --- Login OTP: DB-backed, matches the reset_token pattern ---

def set_login_otp(db: Session, user: models.User, otp_hash: str, expires_minutes: int = 10) -> models.User:
    user.login_otp_hash = otp_hash
    user.login_otp_expires_at = datetime.utcnow() + timedelta(minutes=expires_minutes)
    db.commit()
    db.refresh(user)
    return user


def verify_login_otp(db: Session, user: models.User, otp_hash: str) -> bool:
    if not user.login_otp_hash or not user.login_otp_expires_at:
        return False
    if user.login_otp_expires_at < datetime.utcnow():
        return False
    return user.login_otp_hash == otp_hash


def clear_login_otp(db: Session, user: models.User):
    user.login_otp_hash = None
    user.login_otp_expires_at = None
    db.commit()
    

# --- KYC (doctors) — mirrors patient_repository's KYC pattern ---

def submit_doctor_kyc(db: Session, user: models.User, selfie_url: str, id_document_url: str) -> models.User:
    user.kyc_selfie_url = selfie_url
    user.kyc_id_document_url = id_document_url
    user.kyc_status = "pending"
    db.commit()
    db.refresh(user)
    return user


def get_pending_doctor_kyc(db: Session, limit: int = 50):
    return (
        db.query(models.User)
        .filter(models.User.role == "doctor", models.User.kyc_status == "pending")
        .limit(limit)
        .all()
    )


def resolve_doctor_kyc(db: Session, user: models.User, approve: bool, note: str = None) -> models.User:
    user.kyc_status = "approved" if approve else "rejected"
    user.kyc_verified = approve
    user.kyc_verified_at = datetime.utcnow() if approve else None
    user.kyc_reviewed_by_note = note
    db.commit()
    db.refresh(user)
    return user