from sqlalchemy.orm import Session

import models


def get_facility_by_invite_code(db: Session, invite_code: str) -> models.Facility | None:
    return db.query(models.Facility).filter(models.Facility.invite_code == invite_code).first()


def get_facility_by_id(db: Session, facility_id: int) -> models.Facility | None:
    return db.query(models.Facility).filter(models.Facility.id == facility_id).first()

def create_facility(db: Session, name: str, invite_code: str) -> models.Facility:
    new_facility = models.Facility(name=name, invite_code=invite_code)
    db.add(new_facility)
    db.commit()
    db.refresh(new_facility)
    return new_facility


def get_all_facilities(db: Session) -> list[models.Facility]:
    return db.query(models.Facility).all()