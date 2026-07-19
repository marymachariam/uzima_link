from sqlalchemy.orm import Session

import models


def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> models.User | None:
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(db: Session, email: str, password_hash: str, role: str,
                 full_name: str = None, facility_id: int = None, patient_id: int = None) -> models.User:
    new_user = models.User(
        email=email,
        password_hash=password_hash,
        role=role,
        full_name=full_name,
        facility_id=facility_id,
        patient_id=patient_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user