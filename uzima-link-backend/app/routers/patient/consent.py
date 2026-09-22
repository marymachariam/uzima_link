from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from app.core.dependencies import require_role
import app.repository.consent_repository as consent_repository
import app.services.audit_service as audit_service
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/patient/consent", tags=["patient-consent"])


@router.post("", response_model=schemas.ConsentOut)
def grant_consent(
    data: schemas.ConsentGrant,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    consent = consent_repository.create_consent(
        db, patient_id=user.patient_id, facility_id=data.facility_id,
        doctor_id=data.doctor_id, scope=data.scope
    )
    audit_service.log_action(db, user_id=user.id, action="grant_consent", resource_type="consent", resource_id=consent.id)
    return consent


@router.get("", response_model=list[schemas.ConsentOut])
def list_my_consents(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    return consent_repository.get_consents_for_patient(db, user.patient_id)


@router.delete("/{consent_id}")
def revoke_consent(
    consent_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    consent = consent_repository.get_consent_by_id(db, consent_id)
    if not consent or consent.patient_id != user.patient_id:
        raise HTTPException(status_code=404, detail="Consent record not found")

    consent_repository.revoke_consent(db, consent)
    audit_service.log_action(db, user_id=user.id, action="revoke_consent", resource_type="consent", resource_id=consent.id)
    return {"message": "Consent revoked"}


@router.get("/requests", response_model=list[schemas.ConsentRequestOut])
def list_pending_requests(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    return consent_repository.get_pending_requests_for_patient(db, user.patient_id)


@router.post("/requests/{request_id}/respond", response_model=schemas.ConsentRequestOut)
def respond_to_request(
    request_id: str,
    data: schemas.ConsentRequestDecision,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    request = consent_repository.get_consent_request_by_id(db, request_id)
    if not request or request.patient_id != user.patient_id:
        raise HTTPException(status_code=404, detail="Consent request not found")

    status = "approved" if data.approve else "denied"
    updated = consent_repository.resolve_consent_request(db, request, status)

    if data.approve:
        consent_repository.create_consent(db, patient_id=user.patient_id, facility_id=request.facility_id, scope="full_record")

    audit_service.log_action(db, user_id=user.id, action=f"consent_request_{status}", resource_type="consent_request", resource_id=request.id)
    return updated