from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.dependencies import require_role
from app.repository import patient_repository
from app.services import audit_service, cloudinary_service, email_service
from config import settings
from database import get_db

router = APIRouter(prefix="/patient/kyc", tags=["patient-kyc"])


@router.post("/submit", response_model=schemas.KycStatusOut)
def submit_identity_verification(
    selfie: UploadFile = File(...),
    id_document: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    patient = patient_repository.get_patient_by_id(db, user.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    if not patient.national_id or patient.id_type == "none":
        raise HTTPException(
            status_code=400,
            detail="An ID number must be on file before identity verification",
        )

    for f in (selfie, id_document):
        if f.content_type not in ("image/jpeg", "image/png"):
            raise HTTPException(
                status_code=400, detail="Both photos must be JPEG or PNG images"
            )

    selfie_url = cloudinary_service.upload_kyc_selfie(selfie.file, str(patient.id))
    id_document_url = cloudinary_service.upload_kyc_id_document(
        id_document.file, str(patient.id)
    )
    patient_repository.submit_kyc(db, patient, selfie_url, id_document_url)

    audit_service.log_action(
        db,
        user_id=user.id,
        action="submit_kyc",
        resource_type="patient",
        resource_id=patient.id,
    )

    try:
        email_service.send_admin_kyc_notification(
            settings.ADMIN_NOTIFICATION_EMAIL, patient.full_name, "patient"
        )
    except Exception as e:
        print(f"Failed to send admin KYC notification: {e}")

    return schemas.KycStatusOut(
        kyc_status="pending",
        kyc_verified=False,
        message="Your identity verification has been submitted and is pending review.",
    )


@router.get("/status", response_model=schemas.KycStatusOut)
def get_kyc_status(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    patient = patient_repository.get_patient_by_id(db, user.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    messages = {
        None: "You have not submitted identity verification yet.",
        "pending": "Your identity verification is pending review.",
        "approved": "Your identity has been verified.",
        "rejected": "Your identity verification was not approved. Please resubmit with clearer photos.",
    }
    return schemas.KycStatusOut(
        kyc_status=patient.kyc_status,
        kyc_verified=patient.kyc_verified,
        message=messages.get(patient.kyc_status, ""),
    )
