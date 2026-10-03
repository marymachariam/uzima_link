from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.dependencies import require_role
from app.repository import queue_repository
from database import get_db

router = APIRouter(prefix="/patient/queue", tags=["patient-queue"])


@router.get("/status", response_model=schemas.QueueEntryOut | None)
def get_my_queue_status(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    entry = queue_repository.get_active_entry_for_patient(db, user.patient_id)
    if not entry:
        return None

    position = queue_repository.get_position_in_queue(db, entry)
    return schemas.QueueEntryOut(
        id=entry.id,
        patient_id=entry.patient_id,
        patient_name=None,
        patient_system_uid=None,
        facility_id=entry.facility_id,
        assigned_doctor_id=entry.assigned_doctor_id,
        status=entry.status,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
        position=position,
    )