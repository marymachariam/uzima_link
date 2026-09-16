from uuid import UUID
from sqlalchemy.orm import Session

import app.models as models


def create_visit(db: Session, patient_id: UUID, facility_id: UUID = None,
                  attending_doctor_id: UUID = None, source: str = "kiosk",
                  raw_transcript: str = None) -> models.Visit:
    new_visit = models.Visit(
        patient_id=patient_id,
        facility_id=facility_id,
        attending_doctor_id=attending_doctor_id,
        source=source,
        raw_transcript=raw_transcript,
    )
    db.add(new_visit)
    db.commit()
    db.refresh(new_visit)
    return new_visit


def get_visit_by_id(db: Session, visit_id: UUID) -> models.Visit | None:
    return db.query(models.Visit).filter(models.Visit.id == visit_id).first()


def get_visits_for_patient(db: Session, patient_id: UUID, limit: int = 50):
    return (
        db.query(models.Visit)
        .filter(models.Visit.patient_id == patient_id)
        .order_by(models.Visit.visit_date.desc())
        .limit(limit)
        .all()
    )


def get_latest_visit_for_patient(db: Session, patient_id: UUID) -> models.Visit | None:
    return (
        db.query(models.Visit)
        .filter(models.Visit.patient_id == patient_id)
        .order_by(models.Visit.visit_date.desc())
        .first()
    )


def add_doctor_notes(db: Session, visit: models.Visit, doctor_notes: str,
                      attending_doctor_id: UUID) -> models.Visit:
    visit.doctor_notes = doctor_notes
    visit.attending_doctor_id = attending_doctor_id
    db.commit()
    db.refresh(visit)
    return visit


def add_transcripts(db: Session, visit: models.Visit, english_transcript: str = None,
                     swahili_transcript: str = None) -> models.Visit:
    if english_transcript is not None:
        visit.english_transcript = english_transcript
    if swahili_transcript is not None:
        visit.swahili_transcript = swahili_transcript
    db.commit()
    db.refresh(visit)
    return visit