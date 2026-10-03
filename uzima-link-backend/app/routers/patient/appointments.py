from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.dependencies import require_role
from app.repository import appointment_repository as repo
from app.services import audit_service
from database import get_db

router = APIRouter(prefix="/patient/appointments", tags=["patient-appointments"])

@router.get("/facilities", response_model=list[schemas.FacilityListOut])
def list_facilities(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    return repo.list_facilities_with_doctors(db)


@router.get("/doctors", response_model=list[schemas.DoctorListOut])
def list_doctors(
    facility_id: UUID | None = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    return [
        schemas.DoctorListOut(
            id=d.id,
            full_name=d.full_name,
            specialty=d.specialty,
            facility_id=d.facility_id,
            facility_name=d.facility.name if d.facility else None,
        )
        for d in repo.list_doctors(db, facility_id)
    ]


@router.get("/doctors/{doctor_id}/slots", response_model=list[schemas.SlotOut])
def open_slots(
    doctor_id: UUID,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    return repo.list_slots_for_doctor(db, doctor_id, only_open=True)


@router.post("", response_model=schemas.AppointmentOut)
def book(
    data: schemas.AppointmentBook,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    slot = repo.get_slot_by_id(db, data.slot_id, lock=True)
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if slot.is_booked:
        raise HTTPException(status_code=409, detail="Slot already booked")
    appt = repo.book_slot(db, user.patient_id, slot)
    audit_service.log_action(
        db,
        user_id=user.id,
        action="book_appointment",
        resource_type="appointment",
        resource_id=appt.id,
    )
    return appt


@router.get("", response_model=list[schemas.AppointmentOut])
def my_appointments(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    return repo.list_appointments_for_patient(db, user.patient_id)


@router.delete("/{appointment_id}", response_model=schemas.AppointmentOut)
def cancel(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    appt = repo.get_appointment_by_id(db, appointment_id)
    if not appt or appt.patient_id != user.patient_id:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appt.status != "booked":
        raise HTTPException(status_code=409, detail="Appointment is not active")
    appt = repo.cancel_appointment(db, appt)
    audit_service.log_action(
        db,
        user_id=user.id,
        action="cancel_appointment",
        resource_type="appointment",
        resource_id=appt.id,
    )
    return appt