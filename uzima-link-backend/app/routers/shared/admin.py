import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from app.core.admin_auth import require_admin_key
import app.repository.facility_repository as facility_repository
import app.repository.patient_repository as patient_repository
import app.repository.user_repository as user_repository
import app.services.email_service as email_service
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
    return facility_repository.generate_invite_code_for_facility(db, facility)


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


@router.post("/invite-staff", response_model=schemas.StaffInviteOut)
def invite_staff(
    data: schemas.InviteStaffRequest,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin_key),
):
    facility = None
    if data.facility_kmhfr_code:
        facility = facility_repository.get_facility_by_kmhfr_code(db, data.facility_kmhfr_code)
    elif data.facility_registration_number:
        facility = facility_repository.get_facility_by_registration_number(db, data.facility_registration_number)

    if not facility:
        raise HTTPException(status_code=404, detail="No facility found with that identifier")

    if not facility.invite_code:
        facility_repository.generate_invite_code_for_facility(db, facility)

    try:
        email_service.send_staff_invite_email(data.email, data.full_name, data.role, facility.name, facility.invite_code)
    except Exception as e:
        print(f"Failed to send staff invite email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send invite email")

    return schemas.StaffInviteOut(message=f"Invite sent to {data.email}", facility_name=facility.name)


@router.get("/kyc/patients/pending", response_model=list[schemas.AdminPatientKycOut])
def list_pending_patient_kyc(db: Session = Depends(get_db), _: None = Depends(require_admin_key)):
    return patient_repository.get_pending_kyc_patients(db)

@router.post("/kyc/patients/{patient_id}/decision", response_model=schemas.AdminPatientKycOut)
def decide_patient_kyc(
    patient_id: str, data: schemas.KycDecision,
    db: Session = Depends(get_db), _: None = Depends(require_admin_key),
):
    patient = patient_repository.get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    updated = patient_repository.resolve_kyc(db, patient, approve=data.approve, note=data.note)

    if data.approve:
        user = user_repository.get_user_by_patient_id(db, patient.id)
        if user:
            try:
                email_service.send_patient_kyc_approved_email(user.email, patient.full_name)
            except Exception as e:
                print(f"Failed to send patient approval email: {e}")

    return updated 

@router.get("/kyc/doctors/pending", response_model=list[schemas.AdminDoctorKycOut])
def list_pending_doctor_kyc(db: Session = Depends(get_db), _: None = Depends(require_admin_key)):
    return user_repository.get_pending_doctor_kyc(db)


@router.post("/kyc/doctors/{user_id}/decision", response_model=schemas.UserOut)
def decide_doctor_kyc(
    user_id: str, data: schemas.KycDecision,
    db: Session = Depends(get_db), _: None = Depends(require_admin_key),
):
    user = user_repository.get_user_by_id(db, user_id)
    if not user or user.role != "doctor":
        raise HTTPException(status_code=404, detail="Doctor not found")

    updated = user_repository.resolve_doctor_kyc(db, user, approve=data.approve, note=data.note)

    if data.approve:
        facility = facility_repository.get_facility_by_id(db, user.facility_id)
        if facility:
            if not facility.invite_code:
                facility_repository.generate_invite_code_for_facility(db, facility)
            try:
                email_service.send_doctor_approval_email(
                    to_email=user.email,
                    to_name=user.full_name,
                    facility_name=facility.name,
                    invite_code=facility.invite_code
                )
            except Exception as e:
                print(f"Failed to send doctor approval email: {e}")

    return updated