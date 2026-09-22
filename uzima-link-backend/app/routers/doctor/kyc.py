from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
from app.core.dependencies import require_role
from config import settings
import app.repository.user_repository as user_repository
import app.services.cloudinary_service as cloudinary_service
import app.services.audit_service as audit_service
import app.services.email_service as email_service
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/doctor/kyc", tags=["doctor-kyc"])

@router.post("/submit", response_model=schemas.KycStatusOut)
def submit_identity_verification(
    selfie: UploadFile = File(...),
    id_document: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("doctor")),
):
    for f in (selfie, id_document):
        if f.content_type not in ("image/jpeg", "image/png"):
            raise HTTPException(status_code=400, detail="Both photos must be JPEG or PNG images")

    selfie_url = cloudinary_service.upload_doctor_kyc_selfie(selfie.file, str(user.id))
    id_document_url = cloudinary_service.upload_kyc_id_document(id_document.file, str(user.id))
    user_repository.submit_doctor_kyc(db, user, selfie_url, id_document_url)

    audit_service.log_action(db, user_id=user.id, action="submit_kyc", resource_type="user", resource_id=user.id)

    try:
        email_service.send_admin_kyc_notification(settings.ADMIN_NOTIFICATION_EMAIL, user.full_name, "doctor")
    except Exception as e:
        print(f"Failed to send admin KYC notification: {e}")

    return schemas.KycStatusOut(
        kyc_status="pending", kyc_verified=False,
        message="Your identity verification has been submitted and is pending review."
    )


@router.get("/status", response_model=schemas.KycStatusOut)
def get_kyc_status(user: models.User = Depends(require_role("doctor"))):
    messages = {
        None: "You have not submitted identity verification yet.",
        "pending": "Your identity verification is pending review.",
        "approved": "Your identity has been verified.",
        "rejected": "Your identity verification was not approved. Please resubmit with clearer photos.",
    }
    return schemas.KycStatusOut(
        kyc_status=user.kyc_status, kyc_verified=user.kyc_verified,
        message=messages.get(user.kyc_status, "")
    )