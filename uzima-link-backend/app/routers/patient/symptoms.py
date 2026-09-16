from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
from app.core.dependencies import require_role
import app.repository.visit_repository as visit_repository
import app.services.transcription_service as transcription_service
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/patient/symptoms", tags=["patient-symptoms"])


@router.post("", response_model=schemas.VisitOut)
def log_symptoms(
    data: schemas.SymptomEntryCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    visit = visit_repository.create_visit(
        db,
        patient_id=user.patient_id,
        source="patient_self_report",
        raw_transcript=data.text,
    )
    return visit


@router.post("/voice", response_model=schemas.VisitOut)
def log_symptoms_voice(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    if file.content_type not in ("audio/mpeg", "audio/mp4", "audio/wav", "audio/webm", "audio/ogg", "audio/x-m4a"):
        raise HTTPException(status_code=400, detail="Unsupported audio format")

    audio_bytes = file.file.read()

    try:
        raw_transcript = transcription_service.transcribe_audio(
            io.BytesIO(audio_bytes), file.filename or "audio.webm"
        )
        english_transcript = transcription_service.translate_audio_to_english(
            io.BytesIO(audio_bytes), file.filename or "audio.webm"
        )
    except Exception:
        raise HTTPException(status_code=502, detail="Failed to process audio. Please try again.")

    visit = visit_repository.create_visit(
        db,
        patient_id=user.patient_id,
        source="patient_voice_report",
        raw_transcript=raw_transcript,
    )
    visit_repository.add_transcripts(db, visit, english_transcript=english_transcript)

    return visit


@router.get("", response_model=list[schemas.VisitOut])
def get_my_symptom_history(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    return visit_repository.get_visits_for_patient(db, user.patient_id)


@router.get("/{visit_id}", response_model=schemas.VisitOut)
def get_symptom_entry(
    visit_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    visit = visit_repository.get_visit_by_id(db, visit_id)
    if not visit or visit.patient_id != user.patient_id:
        raise HTTPException(status_code=404, detail="Entry not found")
    return visit