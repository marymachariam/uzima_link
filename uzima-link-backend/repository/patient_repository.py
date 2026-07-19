from sqlalchemy.orm import Session

import models


def create_patient(db: Session, full_name: str, date_of_birth: str, gender: str,
                    phone_number: str = None, national_id: str = None) -> models.Patient:
    new_patient = models.Patient(
        full_name=full_name,
        date_of_birth=date_of_birth,
        gender=gender,
        phone_number=phone_number,
        national_id=national_id
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient


def get_patient_by_id(db: Session, patient_id: int) -> models.Patient | None:
    return db.query(models.Patient).filter(models.Patient.id == patient_id).first()


def get_patient_by_phone(db: Session, phone_number: str) -> models.Patient | None:
    return db.query(models.Patient).filter(models.Patient.phone_number == phone_number).first()


def get_patient_by_national_id(db: Session, national_id: str) -> models.Patient | None:
    return db.query(models.Patient).filter(models.Patient.national_id == national_id).first()


def get_patient_by_system_uid(db: Session, system_uid: str) -> models.Patient | None:
    return db.query(models.Patient).filter(models.Patient.system_uid == system_uid).first()

def update_patient(db: Session, patient: models.Patient, phone_number: str = None, national_id: str = None) -> models.Patient:
    if phone_number is not None:
        patient.phone_number = phone_number
    if national_id is not None:
        patient.national_id = national_id
    db.commit()
    db.refresh(patient)
    return patient

def get_recently_registered_patients(db: Session, limit: int = 10):
    return (
        db.query(models.Patient)
        .order_by(models.Patient.created_at.desc())
        .limit(limit)
        .all()
    )