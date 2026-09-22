from uuid import UUID
from sqlalchemy.orm import Session

import app.models as models


def create_clinical_entity(db: Session, visit_id: UUID, entity_type: str,
                            description: str) -> models.ClinicalEntity:
    new_entity = models.ClinicalEntity(
        visit_id=visit_id,
        entity_type=entity_type,
        description=description,
    )
    db.add(new_entity)
    db.commit()
    db.refresh(new_entity)
    return new_entity


def get_entities_for_visit(db: Session, visit_id: UUID):
    return db.query(models.ClinicalEntity).filter(models.ClinicalEntity.visit_id == visit_id).all()


def get_entities_for_patient(db: Session, patient_id: UUID):
    """Joins through Visit to get every clinical entity ever recorded for a patient."""
    return (
        db.query(models.ClinicalEntity)
        .join(models.Visit, models.ClinicalEntity.visit_id == models.Visit.id)
        .filter(models.Visit.patient_id == patient_id)
        .all()
    )