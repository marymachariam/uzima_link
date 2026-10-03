from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app import models


# ---------- slots ----------
def slot_overlaps(db: Session, doctor_id: UUID, start: datetime, end: datetime) -> bool:
    return (
        db.query(models.AvailabilitySlot)
        .filter(
            models.AvailabilitySlot.doctor_id == doctor_id,
            models.AvailabilitySlot.start_time < end,
            models.AvailabilitySlot.end_time > start,
        )
        .first()
        is not None
    )


def create_slot(db: Session, doctor_id: UUID, facility_id: UUID, start: datetime, end: datetime):
    slot = models.AvailabilitySlot(
        doctor_id=doctor_id, facility_id=facility_id, start_time=start, end_time=end
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


def get_slot_by_id(db: Session, slot_id: UUID, lock: bool = False):
    q = db.query(models.AvailabilitySlot).filter(models.AvailabilitySlot.id == slot_id)
    if lock:
        q = q.with_for_update()  # prevents two patients booking the same slot
    return q.first()


def list_slots_for_doctor(db: Session, doctor_id: UUID, only_open: bool = False):
    q = db.query(models.AvailabilitySlot).filter(
        models.AvailabilitySlot.doctor_id == doctor_id,
        models.AvailabilitySlot.start_time >= datetime.utcnow(),
    )
    if only_open:
        q = q.filter(models.AvailabilitySlot.is_booked == False)
    return q.order_by(models.AvailabilitySlot.start_time).all()


def delete_slot(db: Session, slot: models.AvailabilitySlot):
    db.delete(slot)
    db.commit()


# ---------- appointments ----------
def book_slot(db: Session, patient_id: UUID, slot: models.AvailabilitySlot):
    slot.is_booked = True
    appt = models.Appointment(
        patient_id=patient_id,
        doctor_id=slot.doctor_id,
        facility_id=slot.facility_id,
        slot_id=slot.id,
        scheduled_time=slot.start_time,
        status="booked",
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return appt


def get_appointment_by_id(db: Session, appointment_id: UUID):
    return (
        db.query(models.Appointment)
        .filter(models.Appointment.id == appointment_id)
        .first()
    )


def cancel_appointment(db: Session, appt: models.Appointment):
    appt.status = "cancelled"
    slot = get_slot_by_id(db, appt.slot_id, lock=True)
    if slot:
        slot.is_booked = False  # slot becomes available again
    db.commit()
    db.refresh(appt)
    return appt


def list_appointments_for_patient(db: Session, patient_id: UUID):
    return (
        db.query(models.Appointment)
        .filter(models.Appointment.patient_id == patient_id)
        .order_by(models.Appointment.scheduled_time)
        .all()
    )


def list_appointments_for_doctor(db: Session, doctor_id: UUID):
    return (
        db.query(models.Appointment)
        .filter(
            models.Appointment.doctor_id == doctor_id,
            models.Appointment.status == "booked",
            models.Appointment.scheduled_time >= datetime.utcnow(),
        )
        .order_by(models.Appointment.scheduled_time)
        .all()
    )
def list_doctors(db: Session, facility_id: UUID | None = None):
    q = db.query(models.User).filter(
        models.User.role == "doctor",
        models.User.is_verified == True,
        models.User.facility_id.isnot(None),
    )
    if facility_id:
        q = q.filter(models.User.facility_id == facility_id)
    return q.all()


def list_facilities_with_doctors(db: Session):
    return (
        db.query(models.Facility)
        .join(models.User, models.User.facility_id == models.Facility.id)
        .filter(models.User.role == "doctor", models.User.is_verified == True)
        .distinct()
        .order_by(models.Facility.name)
        .all()
    )
    
def enrich_appointments(db: Session, appts):
    result = []
    for a in appts:
        doctor = db.query(models.User).filter(models.User.id == a.doctor_id).first()
        patient_user = (
            db.query(models.User).filter(models.User.patient_id == a.patient_id).first()
        )
        facility = (
            db.query(models.Facility).filter(models.Facility.id == a.facility_id).first()
        )
        slot = get_slot_by_id(db, a.slot_id)
        result.append(
            {
                "id": a.id,
                "patient_id": a.patient_id,
                "doctor_id": a.doctor_id,
                "facility_id": a.facility_id,
                "slot_id": a.slot_id,
                "scheduled_time": a.scheduled_time,
                "end_time": slot.end_time if slot else None,
                "status": a.status,
                "created_at": a.created_at,
                "doctor_name": doctor.full_name if doctor else None,
                "doctor_specialty": doctor.specialty if doctor else None,
                "facility_name": facility.name if facility else None,
                "patient_name": patient_user.full_name if patient_user else None,
            }
        )
    return result