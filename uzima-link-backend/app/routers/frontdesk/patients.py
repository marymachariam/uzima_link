from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.dependencies import require_role
from app.repository import patient_repository
from app.services import audit_service
from database import get_db

router = APIRouter(prefix="/frontdesk/patients", tags=["frontdesk-patients"])


@router.post("/register-walkin", response_model=schemas.PatientOut)
def register_walkin_patient(
    data: schemas.PatientCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("kiosk_operator")),
):
    if data.phone_number and patient_repository.get_patient_by_phone(
        db, data.phone_number
    ):
        raise HTTPException(
            status_code=400, detail="A patient with these details already exists"
        )
    if data.national_id and patient_repository.get_patient_by_national_id(
        db, data.national_id
    ):
        raise HTTPException(
            status_code=400, detail="A patient with these details already exists"
        )

    patient = patient_repository.create_patient(
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
    audit_service.log_action(
        db,
        user_id=user.id,
        action="register_walkin_patient",
        resource_type="patient",
        resource_id=patient.id,
    )
    return patient


@router.get("/search", response_model=list[schemas.PatientOut])
def search_patients(
    query: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("kiosk_operator")),
):
    return patient_repository.search_patients(db, query)
