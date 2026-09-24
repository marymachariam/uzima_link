from uuid import UUID

from sqlalchemy.orm import Session

from app import models


def create_prescription(
    db: Session,
    patient_id: UUID,
    doctor_id: UUID,
    medication_name: str,
    visit_id: UUID = None,
    dosage_instructions: str = None,
    notes: str = None,
) -> models.Prescription:
    prescription = models.Prescription(
        patient_id=patient_id,
        doctor_id=doctor_id,
        visit_id=visit_id,
        medication_name=medication_name,
        dosage_instructions=dosage_instructions,
        notes=notes,
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    return prescription


def get_prescriptions_for_patient(db: Session, patient_id: UUID):
    return (
        db.query(models.Prescription)
        .filter(models.Prescription.patient_id == patient_id)
        .order_by(models.Prescription.created_at.desc())
        .all()
    )


def get_prescription_by_id(
    db: Session, prescription_id: UUID
) -> models.Prescription | None:
    return (
        db.query(models.Prescription)
        .filter(models.Prescription.id == prescription_id)
        .first()
    )
