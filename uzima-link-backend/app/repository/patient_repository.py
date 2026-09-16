from uuid import UUID
from sqlalchemy.orm import Session

import app.models as models


def create_patient(db: Session, full_name: str, date_of_birth: str, gender: str,
                    phone_number: str = None, id_type: str = "none", national_id: str = None,
                    guardian_name: str = None, guardian_phone: str = None) -> models.Patient:
    new_patient = models.Patient(
        full_name=full_name,
        date_of_birth=date_of_birth,
        gender=gender,
        phone_number=phone_number,
        id_type=id_type,
        national_id=national_id,
        guardian_name=guardian_name,
        guardian_phone=guardian_phone,
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient


def get_patient_by_id(db: Session, patient_id: UUID) -> models.Patient | None:
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
    
def update_patient_profile(db: Session, patient: models.Patient, full_name: str = None,
                            phone_number: str = None, guardian_name: str = None,
                            guardian_phone: str = None, photo_url: str = None) -> models.Patient:
    if full_name is not None:
        patient.full_name = full_name
    if phone_number is not None:
        patient.phone_number = phone_number
    if guardian_name is not None:
        patient.guardian_name = guardian_name
    if guardian_phone is not None:
        patient.guardian_phone = guardian_phone
    if photo_url is not None:
        patient.photo_url = photo_url
    db.commit()
    db.refresh(patient)
    return patient

def mark_patient_kyc_verified(db: Session, patient: models.Patient, job_id: str) -> models.Patient:
    from datetime import datetime
    patient.kyc_verified = True
    patient.kyc_verified_at = datetime.utcnow()
    patient.kyc_job_id = job_id
    db.commit()
    db.refresh(patient)
    return patient

def search_patients(db: Session, query: str, limit: int = 20):
    like = f"%{query}%"
    return (
        db.query(models.Patient)
        .filter(
            (models.Patient.full_name.ilike(like)) |
            (models.Patient.phone_number.ilike(like)) |
            (models.Patient.national_id.ilike(like)) |
            (models.Patient.system_uid.ilike(like))
        )
        .limit(limit)
        .all()
    )

def submit_kyc(db: Session, patient: models.Patient, selfie_url: str) -> models.Patient:
    patient.kyc_selfie_url = selfie_url
    patient.kyc_status = "pending"
    db.commit()
    db.refresh(patient)
    return patient


def get_pending_kyc_patients(db: Session, limit: int = 50):
    return db.query(models.Patient).filter(models.Patient.kyc_status == "pending").limit(limit).all()


def resolve_kyc(db: Session, patient: models.Patient, approve: bool, note: str = None) -> models.Patient:
    from datetime import datetime
    patient.kyc_status = "approved" if approve else "rejected"
    patient.kyc_verified = approve
    patient.kyc_verified_at = datetime.utcnow() if approve else None
    patient.kyc_reviewed_by_note = note
    db.commit()
    db.refresh(patient)
    return patient

def mark_phone_verified(db: Session, patient: models.Patient) -> models.Patient:
    patient.phone_verified = True
    db.commit()
    db.refresh(patient)
    return patient