from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import repository.patient_repository as patient_repository
import schemas
import models
from routers.dependencies import get_current_user

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("", response_model=schemas.PatientOut)
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db)):
    return patient_repository.create_patient(
        db, patient.full_name, patient.date_of_birth, patient.gender,
        patient.phone_number, patient.national_id
    )


@router.get("/lookup", response_model=schemas.PatientOut)
def lookup_patient(
    phone_number: str = None,
    national_id: str = None,
    system_uid: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ("doctor", "kiosk_operator"):
        raise HTTPException(status_code=403, detail="Not authorized to look up patients")

    if not phone_number and not national_id and not system_uid:
        raise HTTPException(status_code=400, detail="Provide phone_number, national_id, or system_uid")

    if phone_number:
        patient = patient_repository.get_patient_by_phone(db, phone_number)
    elif national_id:
        patient = patient_repository.get_patient_by_national_id(db, national_id)
    else:
        patient = patient_repository.get_patient_by_system_uid(db, system_uid)

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
@router.patch("/{patient_id}", response_model=schemas.PatientOut)
def update_patient(
    patient_id: int,
    data: schemas.PatientUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    is_self = current_user.role == "patient" and current_user.patient_id == patient_id
    is_staff = current_user.role in ("doctor", "kiosk_operator")
    if not is_self and not is_staff:
        raise HTTPException(status_code=403, detail="Not authorized")

    patient = patient_repository.get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return patient_repository.update_patient(db, patient, data.phone_number, data.national_id)

@router.get("/notifications/recent", response_model=list[schemas.PatientNotification])
def get_recent_registrations(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ("doctor", "kiosk_operator"):
        raise HTTPException(status_code=403, detail="Not authorized")

    return patient_repository.get_recently_registered_patients(db, limit)