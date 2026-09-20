from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
import app.repository.user_repository as user_repository
import app.repository.patient_repository as patient_repository
import app.services.email_service as email_service
import app.services.auth_service as auth_service
import app.schemas as schemas
from app.core.limiter import limiter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/verify-email")
def verify_email(data: schemas.VerifyEmailRequest, db: Session = Depends(get_db)):
    user = user_repository.get_user_by_verification_token(db, data.token)
    if not user:
        raise HTTPException(status_code=400, detail="This verification link is invalid or has expired.")

    if not user.is_verified:
        user_repository.mark_user_verified(db, user)
        user_repository.clear_email_verification_token(db, user)

        display_name = user.full_name
        if user.role == "patient" and user.patient_id:
            patient = patient_repository.get_patient_by_id(db, user.patient_id)
            if patient:
                display_name = patient.full_name

        try:
            email_service.send_welcome_email(user.email, display_name or "there", user.role)
        except Exception as e:
            print(f"Failed to send welcome email: {e}")

    return {"message": "Email verified successfully."}


@router.post("/resend-verification")
@limiter.limit("3/hour")
def resend_verification(request: Request, data: schemas.ResendVerificationRequest, db: Session = Depends(get_db)):
    user = user_repository.get_user_by_email(db, data.email)
    if user and not user.is_verified:
        token = auth_service.generate_email_verification_token()
        user_repository.set_email_verification_token(db, user, token)

        display_name = user.full_name
        if user.role == "patient" and user.patient_id:
            patient = patient_repository.get_patient_by_id(db, user.patient_id)
            if patient:
                display_name = patient.full_name

        try:
            email_service.send_verification_email(user.email, display_name or "there", token)
        except Exception as e:
            print(f"Failed to resend verification email: {e}")

    return {"message": "If an account exists with that email and isn't verified yet, a new link has been sent."}