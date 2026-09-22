from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from app.core.dependencies import require_role
import app.repository.prescription_repository as prescription_repository
import app.repository.consent_repository as consent_repository
import app.services.audit_service as audit_service
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/doctor/prescriptions", tags=["doctor-prescriptions"])


@router.post("", response_model=schemas.PrescriptionOut)
def prescribe_medication(
    data: schemas.PrescriptionCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("doctor")),
):
    if not consent_repository.has_doctor_access(db, data.patient_id, user.id, user.facility_id):
        raise HTTPException(status_code=403, detail="You don't have access to this patient's record")

    prescription = prescription_repository.create_prescription(
        db, patient_id=data.patient_id, doctor_id=user.id, medication_name=data.medication_name,
        visit_id=data.visit_id, dosage_instructions=data.dosage_instructions, notes=data.notes,
    )
    audit_service.log_action(db, user_id=user.id, action="prescribe_medication", resource_type="prescription", resource_id=prescription.id)
    return prescription