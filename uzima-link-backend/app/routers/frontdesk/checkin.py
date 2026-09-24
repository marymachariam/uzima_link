from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.dependencies import require_role
from app.repository import consent_repository, patient_repository, queue_repository
from app.services import audit_service
from database import get_db

router = APIRouter(prefix="/frontdesk/checkin", tags=["frontdesk-checkin"])


@router.post("", response_model=schemas.QueueEntryOut)
def check_in_patient(
    data: schemas.QueueEntryCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("kiosk_operator")),
):
    patient = patient_repository.get_patient_by_id(db, data.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    entry = queue_repository.create_queue_entry(
        db, patient_id=patient.id, facility_id=user.facility_id
    )

    consent_repository.create_consent_request(
        db, patient_id=patient.id, facility_id=user.facility_id, requested_by=user.id
    )

    audit_service.log_action(
        db,
        user_id=user.id,
        action="checkin_patient",
        resource_type="patient",
        resource_id=patient.id,
    )
    return entry
