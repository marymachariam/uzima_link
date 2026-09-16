from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from app.core.dependencies import require_role
import app.repository.queue_repository as queue_repository
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/doctor/queue", tags=["doctor-queue"])


@router.get("", response_model=list[schemas.QueueEntryOut])
def get_my_facility_queue(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("doctor")),
):
    return queue_repository.get_queue_for_facility(db, user.facility_id, status="waiting")


@router.patch("/{entry_id}/start", response_model=schemas.QueueEntryOut)
def start_consultation(
    entry_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("doctor")),
):
    entry = queue_repository.get_queue_entry_by_id(db, entry_id)
    if not entry or entry.facility_id != user.facility_id:
        raise HTTPException(status_code=404, detail="Queue entry not found")

    if not entry.assigned_doctor_id:
        queue_repository.assign_doctor(db, entry, user.id)
    return queue_repository.update_status(db, entry, "in_progress")


@router.patch("/{entry_id}/complete", response_model=schemas.QueueEntryOut)
def complete_consultation(
    entry_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("doctor")),
):
    entry = queue_repository.get_queue_entry_by_id(db, entry_id)
    if not entry or entry.facility_id != user.facility_id:
        raise HTTPException(status_code=404, detail="Queue entry not found")

    return queue_repository.update_status(db, entry, "completed")