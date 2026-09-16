from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session

import app.models as models


def get_facility_by_id(db: Session, facility_id: UUID) -> models.Facility | None:
    return db.query(models.Facility).filter(models.Facility.id == facility_id).first()


def get_facility_by_kmhfr_code(db: Session, kmhfr_code: str) -> models.Facility | None:
    return db.query(models.Facility).filter(models.Facility.kmhfr_code == kmhfr_code).first()


def get_facility_by_invite_code(db: Session, invite_code: str) -> models.Facility | None:
    return db.query(models.Facility).filter(models.Facility.invite_code == invite_code).first()


def search_facilities(db: Session, name: str = None, county: str = None, limit: int = 20):
    query = db.query(models.Facility)
    if name:
        query = query.filter(models.Facility.name.ilike(f"%{name}%"))
    if county:
        query = query.filter(models.Facility.county == county)
    return query.limit(limit).all()


def create_facility(db: Session, name: str, kmhfr_code: str = None, facility_type: str = None,
                     county: str = None, sub_county: str = None, source: str = "manual") -> models.Facility:
    new_facility = models.Facility(
        name=name,
        kmhfr_code=kmhfr_code,
        facility_type=facility_type,
        county=county,
        sub_county=sub_county,
        source=source,
        last_synced_at=datetime.utcnow() if source != "manual" else None,
    )
    db.add(new_facility)
    db.commit()
    db.refresh(new_facility)
    return new_facility


def update_facility_from_sync(db: Session, facility: models.Facility, name: str = None,
                               facility_type: str = None, county: str = None, sub_county: str = None) -> models.Facility:
    if name is not None:
        facility.name = name
    if facility_type is not None:
        facility.facility_type = facility_type
    if county is not None:
        facility.county = county
    if sub_county is not None:
        facility.sub_county = sub_county
    facility.source = "kmhfr_sync"
    facility.last_synced_at = datetime.utcnow()
    db.commit()
    db.refresh(facility)
    return facility


def generate_invite_code_for_facility(db: Session, facility: models.Facility, invite_code: str) -> models.Facility:
    facility.invite_code = invite_code
    db.commit()
    db.refresh(facility)
    return facility