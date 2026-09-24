from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app import models


def create_queue_entry(
    db: Session, patient_id: UUID, facility_id: UUID
) -> models.QueueEntry:
    entry = models.QueueEntry(patient_id=patient_id, facility_id=facility_id)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_queue_for_facility(db: Session, facility_id: UUID, status: str = None):
    query = db.query(models.QueueEntry).filter(
        models.QueueEntry.facility_id == facility_id
    )
    if status:
        query = query.filter(models.QueueEntry.status == status)
    return query.order_by(models.QueueEntry.created_at.asc()).all()


def get_queue_entry_by_id(db: Session, entry_id: UUID) -> models.QueueEntry | None:
    return db.query(models.QueueEntry).filter(models.QueueEntry.id == entry_id).first()


def assign_doctor(
    db: Session, entry: models.QueueEntry, doctor_id: UUID
) -> models.QueueEntry:
    entry.assigned_doctor_id = doctor_id
    entry.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(entry)
    return entry


def update_status(
    db: Session, entry: models.QueueEntry, status: str
) -> models.QueueEntry:
    entry.status = status
    entry.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(entry)
    return entry
