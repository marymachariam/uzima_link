from sqlalchemy.orm import Session

import models


def create_allergy(db: Session, patient_id: int, allergen: str, severity: str, reaction: str = None) -> models.Allergy:
    new_allergy = models.Allergy(patient_id=patient_id, allergen=allergen, severity=severity, reaction=reaction)
    db.add(new_allergy)
    db.commit()
    db.refresh(new_allergy)
    return new_allergy


def get_allergies_for_patient(db: Session, patient_id: int) -> list[models.Allergy]:
    return db.query(models.Allergy).filter(models.Allergy.patient_id == patient_id).all()

def get_allergy_by_patient_and_allergen(db: Session, patient_id: int, allergen: str) -> models.Allergy | None:
    return (
        db.query(models.Allergy)
        .filter(models.Allergy.patient_id == patient_id, models.Allergy.allergen == allergen)
        .first()
    )