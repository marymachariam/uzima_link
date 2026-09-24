from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.dependencies import require_role
from app.repository import queue_repository
from database import get_db

router = APIRouter(prefix="/frontdesk/queue", tags=["frontdesk-queue"])


@router.get("", response_model=list[schemas.QueueEntryOut])
def get_facility_queue(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("kiosk_operator")),
):
    return queue_repository.get_queue_for_facility(db, user.facility_id)


@router.patch("/{entry_id}/assign", response_model=schemas.QueueEntryOut)
def assign_doctor_to_entry(
    entry_id: str,
    data: schemas.QueueAssign,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("kiosk_operator")),
):
    entry = queue_repository.get_queue_entry_by_id(db, entry_id)
    if not entry or entry.facility_id != user.facility_id:
        raise HTTPException(status_code=404, detail="Queue entry not found")

    return queue_repository.assign_doctor(db, entry, data.doctor_id)
