from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from app.core.dependencies import require_role
import app.repository.patient_repository as patient_repository
import app.repository.allergy_repository as allergy_repository
import app.repository.visit_repository as visit_repository
import app.repository.consent_repository as consent_repository
import app.services.audit_service as audit_service
import app.models as models
import app.schemas as schemas

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

    if not consent_repository.has_doctor_access(db, patient.id, user.id, user.facility_id):
        raise HTTPException(status_code=403, detail="This patient has not granted you access to their record")

    allergies = allergy_repository.get_allergies_for_patient(db, patient.id)
    visits = visit_repository.get_visits_for_patient(db, patient.id)

    audit_service.log_action(db, user_id=user.id, action="view_patient_record", resource_type="patient", resource_id=patient.id)

    return schemas.DoctorPatientView(patient=patient, allergies=allergies, visits=visits)