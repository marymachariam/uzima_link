from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.dependencies import require_role
from app.repository import patient_repository
from app.services import cloudinary_service
from database import get_db

router = APIRouter(prefix="/patient/profile", tags=["patient-profile"])


@router.get("/me", response_model=schemas.PatientProfileOut)
def get_my_profile(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    patient = patient_repository.get_patient_by_id(db, user.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return patient


@router.patch("/me", response_model=schemas.PatientProfileOut)
def update_my_profile(
    data: schemas.PatientProfileUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    patient = patient_repository.get_patient_by_id(db, user.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    updated = patient_repository.update_patient_profile(
        db,
        patient,
        full_name=data.full_name,
        phone_number=data.phone_number,
        guardian_name=data.guardian_name,
        guardian_phone=data.guardian_phone,
    )
    return updated


@router.post("/me/photo", response_model=schemas.PatientProfileOut)
def upload_my_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    if file.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(status_code=400, detail="Photo must be a JPEG or PNG image")

    patient = patient_repository.get_patient_by_id(db, user.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    photo_url = cloudinary_service.upload_patient_photo(file.file, str(patient.id))
    updated = patient_repository.update_patient_profile(
        db, patient, photo_url=photo_url
    )
    return updated
