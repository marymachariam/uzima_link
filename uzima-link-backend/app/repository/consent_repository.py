from datetime import datetime
from uuid import UUID

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app import models


def create_consent(
    db: Session,
    patient_id: UUID,
    facility_id: UUID = None,
    doctor_id: UUID = None,
    scope: str = "full_record",
) -> models.Consent:
    consent = models.Consent(
        patient_id=patient_id, facility_id=facility_id, doctor_id=doctor_id, scope=scope
    )
    db.add(consent)
    db.commit()
    db.refresh(consent)
    return consent


def get_consents_for_patient(db: Session, patient_id: UUID):
    return (
        db.query(models.Consent).filter(models.Consent.patient_id == patient_id).all()
    )


def get_consent_by_id(db: Session, consent_id: UUID) -> models.Consent | None:
    return db.query(models.Consent).filter(models.Consent.id == consent_id).first()


def revoke_consent(db: Session, consent: models.Consent) -> models.Consent:
    consent.granted = False
    consent.revoked_at = datetime.utcnow()
    db.commit()
    db.refresh(consent)
    return consent


def has_doctor_access(
    db: Session, patient_id: UUID, doctor_id: UUID, facility_id: UUID = None
) -> bool:
    query = db.query(models.Consent).filter(
        models.Consent.patient_id == patient_id,
        models.Consent.granted == True,
        or_(
            models.Consent.doctor_id == doctor_id,
            models.Consent.facility_id == facility_id,
            and_(
                models.Consent.doctor_id.is_(None), models.Consent.facility_id.is_(None)
            ),
        ),
    )
    return query.first() is not None


def create_consent_request(
    db: Session, patient_id: UUID, facility_id: UUID, requested_by: UUID
) -> models.ConsentRequest:
    request = models.ConsentRequest(
        patient_id=patient_id, facility_id=facility_id, requested_by=requested_by
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


def get_pending_requests_for_patient(db: Session, patient_id: UUID):
    return (
        db.query(models.ConsentRequest)
        .filter(
            models.ConsentRequest.patient_id == patient_id,
            models.ConsentRequest.status == "pending",
        )
        .order_by(models.ConsentRequest.created_at.desc())
        .all()
    )


def get_consent_request_by_id(
    db: Session, request_id: UUID
) -> models.ConsentRequest | None:
    return (
        db.query(models.ConsentRequest)
        .filter(models.ConsentRequest.id == request_id)
        .first()
    )


def resolve_consent_request(
    db: Session, request: models.ConsentRequest, status: str
) -> models.ConsentRequest:
    request.status = status
    request.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(request)
    return request
