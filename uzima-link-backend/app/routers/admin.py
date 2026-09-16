import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from app.core.admin_auth import require_admin_key
import app.repository.facility_repository as facility_repository
import app.repository.patient_repository as patient_repository
import app.repository.user_repository as user_repository
import app.schemas as schemas

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/facilities/{facility_id}/generate-invite-code", response_model=schemas.FacilityOut)
def generate_invite_code(
    facility_id: str,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin_key),
):
    facility = facility_repository.get_facility_by_id(db, facility_id)
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")
    invite_code = secrets.token_urlsafe(8)
    return facility_repository.generate_invite_code_for_facility(db, facility, invite_code)


@router.post("/facilities", response_model=schemas.FacilityOut)
def create_facility_manual(
    data: schemas.FacilityCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin_key),
):
    return facility_repository.create_facility(
        db, name=data.name, kmhfr_code=data.kmhfr_code,
        facility_type=data.facility_type, county=data.county, sub_county=data.sub_county, source="manual"
    )


@router.get("/kyc/patients/pending", response_model=list[schemas.PatientOut])
def list_pending_patient_kyc(
    db: Session = Depends(get_db),
    _: None = Depends(require_admin_key),
):
    return patient_repository.get_pending_kyc_patients(db)


@router.post("/kyc/patients/{patient_id}/decision", response_model=schemas.PatientOut)
def decide_patient_kyc(
    patient_id: str,
    data: schemas.KycDecision,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin_key),
):
    patient = patient_repository.get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient_repository.resolve_kyc(db, patient, approve=data.approve, note=data.note)


@router.get("/kyc/doctors/pending", response_model=list[schemas.UserOut])
def list_pending_doctor_kyc(
    db: Session = Depends(get_db),
    _: None = Depends(require_admin_key),
):
    return user_repository.get_pending_doctor_kyc(db)


@router.post("/kyc/doctors/{user_id}/decision", response_model=schemas.UserOut)
def decide_doctor_kyc(
    user_id: str,
    data: schemas.KycDecision,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin_key),
):
    user = user_repository.get_user_by_id(db, user_id)
    if not user or user.role != "doctor":
        raise HTTPException(status_code=404, detail="Doctor not found")
    return user_repository.resolve_doctor_kyc(db, user, approve=data.approve, note=data.note)