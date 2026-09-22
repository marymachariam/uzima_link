from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import io

from database import get_db
from app.core.dependencies import require_role
import app.repository.visit_repository as visit_repository
import app.repository.consent_repository as consent_repository
import app.services.transcription_service as transcription_service
import app.services.audit_service as audit_service
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/doctor/consultations", tags=["doctor-consultations"])


@router.post("", response_model=schemas.VisitOut)
def record_consultation(
    patient_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("doctor")),
):
    if not consent_repository.has_doctor_access(db, patient_id, user.id, user.facility_id):
        raise HTTPException(status_code=403, detail="You don't have access to this patient's record")

    if file.content_type not in ("audio/mpeg", "audio/mp4", "audio/wav", "audio/webm", "audio/ogg", "audio/x-m4a"):
        raise HTTPException(status_code=400, detail="Unsupported audio format")

    audio_bytes = file.file.read()

    try:
        raw_transcript = transcription_service.transcribe_audio(io.BytesIO(audio_bytes), file.filename or "audio.webm")
        english_transcript = transcription_service.translate_audio_to_english(io.BytesIO(audio_bytes), file.filename or "audio.webm")
        swahili_transcript = transcription_service.translate_text(english_transcript, target_language="Swahili")
    except Exception:
        raise HTTPException(status_code=502, detail="Failed to process audio. Please try again.")

    visit = visit_repository.create_visit(
        db, patient_id=patient_id, facility_id=user.facility_id,
        attending_doctor_id=user.id, source="doctor_consultation", raw_transcript=raw_transcript,
    )
    visit_repository.add_transcripts(db, visit, english_transcript=english_transcript, swahili_transcript=swahili_transcript)

    audit_service.log_action(db, user_id=user.id, action="record_consultation", resource_type="visit", resource_id=visit.id)

    return visit