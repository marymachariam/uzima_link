from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from app.core.dependencies import require_role
import app.repository.visit_repository as visit_repository
import app.repository.consent_repository as consent_repository
import app.services.audit_service as audit_service
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/doctor/visits", tags=["doctor-visits"])


@router.post("/note", response_model=schemas.VisitOut)
def add_quick_note(
    data: schemas.DoctorNoteCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("doctor")),
):
    if not consent_repository.has_doctor_access(db, data.patient_id, user.id, user.facility_id):
        raise HTTPException(status_code=403, detail="You don't have access to this patient's record")

    visit = visit_repository.create_visit(
        db, patient_id=data.patient_id, facility_id=user.facility_id,
        attending_doctor_id=user.id, source="doctor_note",
    )
    updated = visit_repository.add_doctor_notes(db, visit, data.note, attending_doctor_id=user.id)
    audit_service.log_action(db, user_id=user.id, action="add_doctor_note", resource_type="visit", resource_id=visit.id)
    return updated


@router.patch("/{visit_id}/notes", response_model=schemas.VisitOut)
def update_visit_notes(
    visit_id: str,
    data: schemas.VisitNotesUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("doctor")),
):
    visit = visit_repository.get_visit_by_id(db, visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    if not consent_repository.has_doctor_access(db, visit.patient_id, user.id, user.facility_id):
        raise HTTPException(status_code=403, detail="You don't have access to this patient's record")

    updated = visit_repository.add_doctor_notes(db, visit, data.doctor_notes, attending_doctor_id=user.id)
    audit_service.log_action(db, user_id=user.id, action="edit_visit_notes", resource_type="visit", resource_id=visit.id)
    return updated