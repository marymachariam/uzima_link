from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.dependencies import require_role
from app.repository import (
    allergy_repository,
    consent_repository,
    patient_repository,
    prescription_repository,
    visit_repository,
)
from app.services import audit_service
from database import get_db

router = APIRouter(prefix="/doctor/patients", tags=["doctor-patients"])


@router.get("/{system_uid}", response_model=schemas.DoctorPatientView)
def view_patient_record(
    system_uid: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("doctor")),
):
    patient = patient_repository.get_patient_by_system_uid(db, system_uid)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if not consent_repository.has_doctor_access(
        db, patient.id, user.id, user.facility_id
    ):
        raise HTTPException(
            status_code=403,
            detail="This patient has not granted you access to their record",
        )

    allergies = allergy_repository.get_allergies_for_patient(db, patient.id)
    visits = visit_repository.get_visits_for_patient(db, patient.id)
    prescriptions = prescription_repository.get_prescriptions_for_patient(
        db, patient.id
    )

    audit_service.log_action(
        db,
        user_id=user.id,
        action="view_patient_record",
        resource_type="patient",
        resource_id=patient.id,
    )

    return schemas.DoctorPatientView(
        patient=patient, allergies=allergies, visits=visits, prescriptions=prescriptions
    )


@router.post("/{system_uid}/request-consent")
def request_patient_consent(
    system_uid: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("doctor")),
):
    patient = patient_repository.get_patient_by_system_uid(db, system_uid)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    consent_repository.create_consent_request(
        db, patient_id=patient.id, facility_id=user.facility_id, requested_by=user.id
    )
    audit_service.log_action(
        db,
        user_id=user.id,
        action="request_consent",
        resource_type="patient",
        resource_id=patient.id,
    )

    return {"message": "A consent request has been sent to the patient."}
