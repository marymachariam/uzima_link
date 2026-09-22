from uuid import UUID
from sqlalchemy.orm import Session

import app.models as models


def create_allergy(db: Session, patient_id: UUID, allergen: str, severity: str,
                    reaction: str = None) -> models.Allergy:
    new_allergy = models.Allergy(
        patient_id=patient_id,
        allergen=allergen,
        severity=severity,
        reaction=reaction,
    )
    db.add(new_allergy)
    db.commit()
    db.refresh(new_allergy)
    return new_allergy


def get_allergies_for_patient(db: Session, patient_id: UUID):
    return db.query(models.Allergy).filter(models.Allergy.patient_id == patient_id).all()


def get_allergy_by_id(db: Session, allergy_id: UUID) -> models.Allergy | None:
    return db.query(models.Allergy).filter(models.Allergy.id == allergy_id).first()


def delete_allergy(db: Session, allergy: models.Allergy):
    db.delete(allergy)
    db.commit()


def has_severe_allergy(db: Session, patient_id: UUID) -> bool:
    """Used for the has_allergy_alert flag shown in PatientListItem."""
    return (
        db.query(models.Allergy)
        .filter(models.Allergy.patient_id == patient_id, models.Allergy.severity == "severe")
        .first()
        is not None
    )