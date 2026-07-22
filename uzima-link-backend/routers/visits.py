import shutil
import tempfile
import os as os_module

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from database import get_db
import repository.patient_repository as patient_repository
import repository.visit_repository as visit_repository
import repository.facility_repository as facility_repository
import repository.allergy_repository as allergy_repository
import services.ai_service as ai_service
import schemas
import models
from routers.dependencies import get_current_user

router = APIRouter(tags=["visits"])


def _run_ai_pipeline(db: Session, visit: models.Visit):
    if not visit.raw_transcript:
        return visit
    try:
        translation = ai_service.translate_text(visit.raw_transcript)
        visit_repository.save_translation(db, visit, translation["english"], translation["swahili"])

        entities = ai_service.extract_clinical_entities(translation["english"])
        for symptom in entities.get("symptoms", []):
            visit_repository.add_clinical_entity(db, visit.id, "symptom", symptom)
        for condition in entities.get("conditions", []):
            visit_repository.add_clinical_entity(db, visit.id, "condition", condition)
        for medication in entities.get("medications", []):
            visit_repository.add_clinical_entity(db, visit.id, "medication", medication)
        db.commit()
        db.refresh(visit)
    except Exception as e:
        print(f"AI processing failed: {e}")
    return visit


def _serialize_visit(visit: models.Visit) -> dict:
    data = schemas.VisitOut.model_validate(visit).model_dump()
    data["attending_doctor_name"] = visit.attending_doctor.full_name if visit.attending_doctor else None
    return data


@router.post("/visits", response_model=schemas.VisitOut)
def create_visit(
    visit: schemas.VisitCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    is_staff = current_user.role in ("doctor", "kiosk_operator")
    is_self_report = current_user.role == "patient" and current_user.patient_id == visit.patient_id

    if not is_staff and not is_self_report:
        raise HTTPException(status_code=403, detail="Not authorized to create this visit")

    patient = patient_repository.get_patient_by_id(db, visit.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if is_staff:
        if visit.facility_id is None:
            raise HTTPException(status_code=400, detail="facility_id is required for staff-recorded visits")
        facility = facility_repository.get_facility_by_id(db, visit.facility_id)
        if not facility:
            raise HTTPException(status_code=404, detail="Facility not found")
        source = "kiosk"
        facility_id = visit.facility_id
    else:
        source = "self_reported"
        facility_id = None

    new_visit = visit_repository.create_visit(db, visit.patient_id, facility_id, visit.raw_transcript, source)
    processed_visit = _run_ai_pipeline(db, new_visit)
    return _serialize_visit(processed_visit)


@router.patch("/visits/{visit_id}/notes", response_model=schemas.VisitOut)
def update_doctor_notes(
    visit_id: int,
    notes: schemas.DoctorNotesUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can update notes")

    visit = visit_repository.get_visit_by_id(db, visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    updated = visit_repository.update_doctor_notes(db, visit, notes.doctor_notes, current_user.id)
    return _serialize_visit(updated)


@router.post("/visits/audio", response_model=schemas.VisitOut)
def create_visit_from_audio(
    patient_id: int = Form(...),
    facility_id: int = Form(None),
    audio_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    is_staff = current_user.role in ("doctor", "kiosk_operator")
    is_self_report = current_user.role == "patient" and current_user.patient_id == patient_id

    if not is_staff and not is_self_report:
        raise HTTPException(status_code=403, detail="Not authorized to create this visit")

    patient = patient_repository.get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if is_staff:
        if facility_id is None:
            raise HTTPException(status_code=400, detail="facility_id is required for staff-recorded visits")
        facility = facility_repository.get_facility_by_id(db, facility_id)
        if not facility:
            raise HTTPException(status_code=404, detail="Facility not found")
        source = "kiosk"
    else:
        facility_id = None
        source = "self_reported"
        suffix = os_module.path.splitext(audio_file.filename)[1] or ".mp3"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(audio_file.file, tmp)
            tmp_path = tmp.name

    debug_dir = "debug_audio"
    os_module.makedirs(debug_dir, exist_ok=True)
    debug_path = os_module.path.join(debug_dir, f"last_upload{suffix}")
    shutil.copy(tmp_path, debug_path)
    print(f"[DEBUG] Saved a copy for inspection at: {debug_path}")

    try:
        raw_transcript = ai_service.transcribe_audio(tmp_path)
    except Exception as e:
        os_module.remove(tmp_path)
        if "AUDIO_PROCESSING_FAILED" in str(e):
            raise HTTPException(status_code=422, detail="We couldn't process that recording. Please try again or type your answer instead.")
        raise HTTPException(status_code=502, detail=f"Transcription failed: {e}")
    os_module.remove(tmp_path)

    new_visit = visit_repository.create_visit(db, patient_id, facility_id, raw_transcript, source)
    processed_visit = _run_ai_pipeline(db, new_visit)
    return _serialize_visit(processed_visit)


@router.get("/patients/{patient_id}/dashboard")
def get_patient_dashboard(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    is_staff = current_user.role in ("doctor", "kiosk_operator")
    is_own_record = current_user.role == "patient" and current_user.patient_id == patient_id

    if not is_staff and not is_own_record:
        raise HTTPException(status_code=403, detail="Not authorized to view this dashboard")

    patient = patient_repository.get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    allergies = allergy_repository.get_allergies_for_patient(db, patient_id)
    visits = visit_repository.get_visits_for_patient(db, patient_id)

    return {
        "patient": schemas.PatientOut.model_validate(patient),
        "allergy_alert": len(allergies) > 0,
        "allergies": [schemas.AllergyOut.model_validate(a) for a in allergies],
        "current_visit": _serialize_visit(visits[0]) if visits else None,
        "visit_history": [_serialize_visit(v) for v in visits[1:]] if len(visits) > 1 else []
    }


@router.get("/facilities/{facility_id}/recent-patients", response_model=list[schemas.PatientListItem])
def get_recent_patients(
    facility_id: int,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ("doctor", "kiosk_operator"):
        raise HTTPException(status_code=403, detail="Not authorized")

    results = visit_repository.get_recent_patients_by_facility(db, facility_id, limit)

    items = []
    for patient, last_visit in results:
        allergies = allergy_repository.get_allergies_for_patient(db, patient.id)
        items.append(schemas.PatientListItem(
            id=patient.id,
            full_name=patient.full_name,
            system_uid=patient.system_uid,
            last_visit=last_visit,
            has_allergy_alert=len(allergies) > 0
        ))
    return items


@router.get("/facilities/{facility_id}/notes", response_model=list[schemas.VisitNoteItem])
def get_facility_notes(
    facility_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ("doctor", "kiosk_operator"):
        raise HTTPException(status_code=403, detail="Not authorized")

    visits = visit_repository.get_visits_with_notes_by_facility(db, facility_id)

    items = []
    for visit in visits:
        patient = patient_repository.get_patient_by_id(db, visit.patient_id)
        items.append(schemas.VisitNoteItem(
            visit_id=visit.id,
            patient_id=visit.patient_id,
            patient_name=patient.full_name if patient else "Unknown",
            visit_date=visit.visit_date,
            doctor_notes=visit.doctor_notes
        ))
    return items