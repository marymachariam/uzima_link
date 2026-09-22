from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from database import get_db
from app.core.dependencies import require_role
import app.repository.patient_repository as patient_repository
import app.repository.allergy_repository as allergy_repository
import app.services.health_card_service as health_card_service
import app.services.audit_service as audit_service
import app.models as models

router = APIRouter(prefix="/patient/health-card", tags=["patient-health-card"])


@router.get("")
def download_health_card(
    format: str = Query("png", pattern="^(png|pdf)$"),
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    patient = patient_repository.get_patient_by_id(db, user.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    allergies = allergy_repository.get_allergies_for_patient(db, patient.id)
    card = health_card_service.generate_health_card_image(patient, allergies)

    audit_service.log_action(db, user_id=user.id, action="download_health_card", resource_type="patient", resource_id=patient.id)

    if format == "pdf":
        data = health_card_service.image_to_pdf_bytes(card)
        media_type = "application/pdf"
        filename = f"uzima-link-card-{patient.system_uid}.pdf"
    else:
        data = health_card_service.image_to_png_bytes(card)
        media_type = "image/png"
        filename = f"uzima-link-card-{patient.system_uid}.png"

    return StreamingResponse(
        io.BytesIO(data),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )