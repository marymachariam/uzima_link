from sqlalchemy.orm import Session

import models


def create_visit(db: Session, patient_id: int, facility_id, raw_transcript: str = None, source: str = "kiosk") -> models.Visit:
    new_visit = models.Visit(
        patient_id=patient_id,
        facility_id=facility_id,
        raw_transcript=raw_transcript,
        source=source
    )
    db.add(new_visit)
    db.commit()
    db.refresh(new_visit)
    return new_visit


def get_visit_by_id(db: Session, visit_id: int) -> models.Visit | None:
    return db.query(models.Visit).filter(models.Visit.id == visit_id).first()


def get_visits_for_patient(db: Session, patient_id: int) -> list[models.Visit]:
    return (
        db.query(models.Visit)
        .filter(models.Visit.patient_id == patient_id)
        .order_by(models.Visit.visit_date.desc())
        .all()
    )


def add_clinical_entity(db: Session, visit_id: int, entity_type: str, description: str) -> models.ClinicalEntity:
    entity = models.ClinicalEntity(visit_id=visit_id, entity_type=entity_type, description=description)
    db.add(entity)
    return entity


def update_doctor_notes(db: Session, visit: models.Visit, notes: str, doctor_id: int) -> models.Visit:
    visit.doctor_notes = notes
    visit.attending_doctor_id = doctor_id
    db.commit()
    db.refresh(visit)
    return visit


def save_translation(db: Session, visit: models.Visit, english: str, swahili: str) -> models.Visit:
    visit.english_transcript = english
    visit.swahili_transcript = swahili
    db.commit()
    db.refresh(visit)
    return visit

def get_recent_patients_by_facility(db: Session, facility_id: int, limit: int = 20):
    from sqlalchemy import func
    subquery = (
        db.query(
            models.Visit.patient_id,
            func.max(models.Visit.visit_date).label("last_visit")
        )
        .filter(models.Visit.facility_id == facility_id)
        .group_by(models.Visit.patient_id)
        .subquery()
    )

    return (
        db.query(models.Patient, subquery.c.last_visit)
        .join(subquery, models.Patient.id == subquery.c.patient_id)
        .order_by(subquery.c.last_visit.desc())
        .limit(limit)
        .all()
    )
def get_visits_with_notes_by_facility(db: Session, facility_id: int):
    return (
        db.query(models.Visit)
        .filter(models.Visit.facility_id == facility_id, models.Visit.doctor_notes.isnot(None), models.Visit.doctor_notes != "")
        .order_by(models.Visit.visit_date.desc())
        .all()
    )