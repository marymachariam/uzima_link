from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app import schemas
from app.core.limiter import limiter
from app.repository import patient_repository, user_repository
from app.services import audit_service, auth_service, email_service
from database import get_db

router = APIRouter(prefix="/patient/auth", tags=["auth"])


@router.post("/register", response_model=schemas.RegistrationPendingOut)
@limiter.limit("5/hour")
def register_patient(
    request: Request, data: schemas.PatientRegister, db: Session = Depends(get_db)
):
    if user_repository.get_user_by_email(db, data.email):
        raise HTTPException(
            status_code=400, detail="Unable to register with these details"
        )

    if patient_repository.get_patient_by_phone(db, data.phone_number):
        raise HTTPException(
            status_code=400, detail="Unable to register with these details"
        )

    if data.national_id and patient_repository.get_patient_by_national_id(
        db, data.national_id
    ):
        raise HTTPException(
            status_code=400, detail="Unable to register with these details"
        )

    new_patient = patient_repository.create_patient(
        db,
        data.full_name,
        data.date_of_birth,
        data.gender,
        data.phone_number,
        data.id_type,
        data.national_id,
        data.guardian_name,
        data.guardian_phone,
    )

    try:
        new_user = user_repository.create_user(
            db,
            data.email,
            auth_service.hash_password(data.password),
            "patient",
            patient_id=new_patient.id,
            is_verified=False,
        )
    except Exception:
        db.rollback()
        db.delete(new_patient)
        db.commit()
        raise HTTPException(
            status_code=500, detail="Registration failed. Please try again."
        )

    email_sent = True
    verification_token = auth_service.generate_email_verification_token()
    user_repository.set_email_verification_token(db, new_user, verification_token)
    try:
        email_service.send_verification_email(
            new_user.email, data.full_name, verification_token
        )
    except Exception as e:
        print(f"Failed to send verification email: {e}")
        email_sent = False

    audit_service.log_action(
        db,
        user_id=new_user.id,
        action="register",
        resource_type="patient",
        resource_id=new_patient.id,
    )

    return schemas.RegistrationPendingOut(
        message="Account created. Please verify your email before logging in.",
        email_verification_sent=email_sent,
    )


def _resolve_patient_login(db: Session, method: str, value: str):
    if method == "email":
        user = user_repository.get_user_by_email(db, value)
        if user and user.role == "patient":
            return user, patient_repository.get_patient_by_id(db, user.patient_id)
    elif method == "phone":
        patient = patient_repository.get_patient_by_phone(db, value)
        if patient:
            return user_repository.get_user_by_patient_id(db, patient.id), patient
    elif method == "national_id":
        patient = patient_repository.get_patient_by_national_id(db, value)
        if patient:
            return user_repository.get_user_by_patient_id(db, patient.id), patient
    return None, None


def _send_login_code(db: Session, user, patient) -> str:
    code = auth_service.generate_otp()
    user_repository.set_login_otp(db, user, auth_service.hash_otp(code))
    display_name = patient.full_name if patient else user.full_name
    email_service.send_login_otp_email(user.email, display_name, code)
    return auth_service.mask_email(user.email)


@router.post("/login/start", response_model=schemas.LoginOtpSentOut)
@limiter.limit("10/hour")
def start_login(
    request: Request, data: schemas.PatientLoginStart, db: Session = Depends(get_db)
):
    if data.method == "national_id":
        raise HTTPException(
            status_code=400,
            detail="Use /patient/auth/login/choose-channel for national ID login",
        )

    user, patient = _resolve_patient_login(db, data.method, data.value)
    if (
        not user
        or user.role != "patient"
        or not auth_service.verify_password(data.password, user.password_hash)
    ):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_verified:
        raise HTTPException(
            status_code=403, detail="Please verify your email before logging in."
        )

    try:
        masked = _send_login_code(db, user, patient)
    except Exception as e:
        print(f"Failed to send login OTP: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to send login code. Please try again."
        )

    return schemas.LoginOtpSentOut(
        message=f"A verification code has been sent to your email: {masked}"
    )


@router.post("/login/choose-channel", response_model=schemas.LoginOtpSentOut)
@limiter.limit("10/hour")
def choose_login_channel(
    request: Request,
    data: schemas.PatientLoginChooseChannel,
    db: Session = Depends(get_db),
):
    patient = patient_repository.get_patient_by_national_id(db, data.national_id)
    if not patient:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = user_repository.get_user_by_patient_id(db, patient.id)
    if not user or not auth_service.verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_verified:
        raise HTTPException(
            status_code=403, detail="Please verify your email before logging in."
        )

    try:
        masked = _send_login_code(db, user, patient)
    except Exception as e:
        print(f"Failed to send login OTP: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to send login code. Please try again."
        )

    note = (
        " SMS delivery is temporarily unavailable, so we've sent it to your email instead."
        if data.channel == "phone"
        else ""
    )
    return schemas.LoginOtpSentOut(
        message=f"A verification code has been sent to your email: {masked}.{note}"
    )


@router.post("/login/verify", response_model=schemas.TokenResponse)
@limiter.limit("10/hour")
def verify_login(
    request: Request, data: schemas.PatientLoginVerify, db: Session = Depends(get_db)
):
    user, _ = _resolve_patient_login(db, data.method, data.value)
    if not user or user.role != "patient":
        raise HTTPException(status_code=401, detail="Invalid login details")

    if not user_repository.verify_login_otp(db, user, auth_service.hash_otp(data.otp)):
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    user_repository.clear_login_otp(db, user)
    audit_service.log_action(
        db, user_id=user.id, action="login", resource_type="user", resource_id=user.id
    )

    token = auth_service.create_access_token(
        {
            "user_id": user.id,
            "role": "patient",
            "patient_id": user.patient_id,
            "verified": True,
        }
    )
    return {"access_token": token, "role": "patient", "verified": True}


@router.post("/forgot-password")
@limiter.limit("3/hour")
def forgot_password(
    request: Request, data: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)
):
    user = user_repository.get_user_by_email(db, data.email)
    if user and user.role == "patient":
        display_name = user.full_name
        if user.patient_id:
            patient = patient_repository.get_patient_by_id(db, user.patient_id)
            if patient:
                display_name = patient.full_name
        reset_token = auth_service.generate_reset_token()
        user_repository.set_reset_token(db, user, reset_token)
        try:
            email_service.send_password_reset_email(
                user.email, reset_token, to_name=display_name
            )
        except Exception as e:
            print(f"Failed to send reset email: {e}")
    return {
        "message": "If an account exists with that email, a reset link has been sent."
    }


@router.post("/reset-password")
def reset_password(data: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    user = user_repository.get_user_by_reset_token(db, data.token)
    if not user:
        raise HTTPException(
            status_code=400, detail="This reset link is invalid or has expired."
        )

    user_repository.update_user_password(
        db, user, auth_service.hash_password(data.new_password)
    )
    user_repository.clear_reset_token(db, user)
    audit_service.log_action(
        db,
        user_id=user.id,
        action="password_reset",
        resource_type="user",
        resource_id=user.id,
    )
    try:
        email_service.send_password_changed_email(user.email, to_name=user.full_name)
    except Exception as e:
        print(f"Failed to send password-changed notice: {e}")

    return {"message": "Password reset successfully."}
