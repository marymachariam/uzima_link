from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas
from app.repository import facility_repository, user_repository
from app.services import auth_service, email_service
from database import get_db

router = APIRouter(prefix="/frontdesk/auth", tags=["auth"])


@router.post("/register", response_model=schemas.RegistrationPendingOut)
def register_frontdesk(data: schemas.FrontdeskRegister, db: Session = Depends(get_db)):
    if user_repository.get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email is already registered")

    facility = facility_repository.get_facility_by_invite_code(db, data.invite_code)
    if not facility:
        raise HTTPException(status_code=400, detail="Invalid invite code")

    new_user = user_repository.create_user(
        db,
        data.email,
        auth_service.hash_password(data.password),
        "kiosk_operator",
        full_name=data.full_name,
        facility_id=facility.id,
        is_verified=False,
    )

    email_sent = True
    verification_token = auth_service.generate_email_verification_token()
    try:
        email_service.send_verification_email(
            new_user.email, data.full_name, verification_token
        )
    except Exception as e:
        print(f"Failed to send verification email: {e}")
        email_sent = False

    return schemas.RegistrationPendingOut(
        message="Account created. Please verify your email before logging in.",
        email_verification_sent=email_sent,
    )


@router.post("/login", response_model=schemas.LoginOtpSentOut)
def login_frontdesk(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = user_repository.get_user_by_email(db, data.email)
    if (
        not user
        or user.role != "kiosk_operator"
        or not auth_service.verify_password(data.password, user.password_hash)
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_verified:
        raise HTTPException(
            status_code=403, detail="Please verify your email before logging in."
        )

    code = auth_service.generate_otp()
    user_repository.set_login_otp(db, user, auth_service.hash_otp(code))
    try:
        email_service.send_login_otp_email(user.email, user.full_name, code)
    except Exception as e:
        print(f"Failed to send login OTP: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to send login code. Please try again."
        )

    masked = auth_service.mask_email(user.email)
    return schemas.LoginOtpSentOut(
        message=f"A verification code has been sent to your email: {masked}"
    )


@router.post("/login/verify", response_model=schemas.TokenResponse)
def verify_frontdesk_login(
    data: schemas.StaffLoginVerify, db: Session = Depends(get_db)
):
    user = user_repository.get_user_by_email(db, data.email)
    if not user or user.role != "kiosk_operator":
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user_repository.verify_login_otp(db, user, auth_service.hash_otp(data.otp)):
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    user_repository.clear_login_otp(db, user)

    token = auth_service.create_access_token(
        {
            "user_id": user.id,
            "role": "kiosk_operator",
            "facility_id": user.facility_id,
            "verified": True,
        }
    )
    return {"access_token": token, "role": "kiosk_operator", "verified": True}


@router.post("/forgot-password")
def forgot_password(data: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = user_repository.get_user_by_email(db, data.email)
    if user and user.role == "doctor":
        reset_token = auth_service.generate_reset_token()
        user_repository.set_reset_token(db, user, reset_token)
        try:
            email_service.send_password_reset_email(
                user.email, reset_token, to_name=user.full_name
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
    try:
        email_service.send_password_changed_email(user.email, to_name=user.full_name)
    except Exception as e:
        print(f"Failed to send password-changed notice: {e}")

    return {"message": "Password reset successfully."}
