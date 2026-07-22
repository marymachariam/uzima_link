from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import repository.user_repository as user_repository
import repository.patient_repository as patient_repository
import repository.facility_repository as facility_repository
import services.auth_service as auth_service
import schemas

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register/patient", response_model=schemas.TokenResponse)
def register_patient(data: schemas.PatientRegister, db: Session = Depends(get_db)):
    if user_repository.get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    new_patient = patient_repository.create_patient(
        db, data.full_name, data.date_of_birth, data.gender, data.phone_number, data.national_id
    )

    new_user = user_repository.create_user(
        db, data.email, auth_service.hash_password(data.password), "patient", patient_id=new_patient.id
    )

    token = auth_service.create_access_token({"user_id": new_user.id, "role": "patient"})
    return {"access_token": token, "role": "patient"}


@router.post("/register/staff", response_model=schemas.TokenResponse)
def register_staff(data: schemas.StaffRegister, db: Session = Depends(get_db)):
    if data.role not in ("doctor", "kiosk_operator"):
        raise HTTPException(status_code=400, detail="Role must be 'doctor' or 'kiosk_operator'")

    if user_repository.get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    facility = facility_repository.get_facility_by_invite_code(db, data.invite_code)
    if not facility:
        raise HTTPException(status_code=400, detail="Invalid invite code")

    new_user = user_repository.create_user(
        db, data.email, auth_service.hash_password(data.password), data.role,
        full_name=data.full_name, facility_id=facility.id
    )

    token = auth_service.create_access_token({"user_id": new_user.id, "role": data.role, "facility_id": facility.id})
    return {"access_token": token, "role": data.role}


@router.post("/login", response_model=schemas.TokenResponse)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = user_repository.get_user_by_email(db, data.email)
    if not user or not auth_service.verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token_data = {"user_id": user.id, "role": user.role}
    if user.facility_id:
        token_data["facility_id"] = user.facility_id
    if user.patient_id:
        token_data["patient_id"] = user.patient_id

    token = auth_service.create_access_token(token_data)
    return {"access_token": token, "role": user.role}

import services.email_service as email_service


@router.post("/forgot-password")
def forgot_password(data: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = user_repository.get_user_by_email(db, data.email)
    if user:
        reset_token = user_repository.create_password_reset_token(db, user.id)
        try:
            email_service.send_password_reset_email(user.email, reset_token.token)
        except Exception as e:
            print(f"Failed to send reset email: {e}")

    # Always return the same message, whether or not the email exists —
    # this prevents leaking which emails are registered in the system
    return {"message": "If an account exists with that email, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(data: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    reset_token = user_repository.get_valid_reset_token(db, data.token)
    if not reset_token:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired.")

    user_repository.update_user_password(db, reset_token.user, auth_service.hash_password(data.new_password))
    user_repository.mark_token_used(db, reset_token)

    return {"message": "Password reset successfully."}