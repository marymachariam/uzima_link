from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from jose import JWTError

from database import get_db
import app.repository.patient_repository as patient_repository
import app.services.auth_service as auth_service
import app.services.sms_service as sms_service
import app.schemas as schemas
from app.core.limiter import limiter

router = APIRouter(prefix="/otp", tags=["otp"])


@router.post("/send")
@limiter.limit("3/hour")
def send_otp(request: Request, data: schemas.SendOtpRequest):
    code = auth_service.generate_otp()
    otp_token = auth_service.create_otp_token(data.phone_number, code)
    try:
        sms_service.send_otp_sms(data.phone_number, code)
    except Exception as e:
        print(f"Failed to send OTP SMS: {e}")
        raise HTTPException(status_code=500, detail="Failed to send verification code")
    return {"otp_token": otp_token}


@router.post("/verify")
@limiter.limit("10/hour")
def verify_otp(request: Request, data: schemas.VerifyOtpRequest, db: Session = Depends(get_db)):
    try:
        phone_number = auth_service.verify_otp_token(data.otp_token, data.code)
    except (JWTError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    patient = patient_repository.get_patient_by_phone(db, phone_number)
    if patient:
        patient_repository.update_patient(db, patient, phone_number=phone_number)

    return {"message": "Phone number verified successfully.", "phone_number": phone_number}