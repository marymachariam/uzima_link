from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.dependencies import require_role
from app.repository import appointment_repository as repo
from database import get_db

router = APIRouter(prefix="/doctor/appointments", tags=["doctor-appointments"])

@router.post("/slots", response_model=schemas.SlotOut)
def create_slot(
    data: schemas.SlotCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("doctor")),
):
    if not user.is_verified:
        raise HTTPException(
            status_code=403, detail="Your account must be verified before creating slots"
        )
    if not user.facility_id:
        raise HTTPException(status_code=400, detail="Doctor is not linked to a facility")
    if repo.slot_overlaps(db, user.id, data.start_time, data.end_time):
        raise HTTPException(status_code=409, detail="Slot overlaps an existing slot")
    return repo.create_slot(db, user.id, user.facility_id, data.start_time, data.end_time)

@router.get("/slots", response_model=list[schemas.SlotOut])
def my_slots(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("doctor")),
):
    return repo.list_slots_for_doctor(db, user.id)


@router.delete("/slots/{slot_id}")
def delete_slot(
    slot_id: UUID,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("doctor")),
):
    slot = repo.get_slot_by_id(db, slot_id)
    if not slot or slot.doctor_id != user.id:
        raise HTTPException(status_code=404, detail="Slot not found")
    if slot.is_booked:
        raise HTTPException(status_code=409, detail="Slot is already booked")
    repo.delete_slot(db, slot)
    return {"message": "Slot deleted"}


@router.get("", response_model=list[schemas.AppointmentOut])
def my_upcoming_appointments(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("doctor")),
):
    return repo.list_appointments_for_doctor(db, user.id)