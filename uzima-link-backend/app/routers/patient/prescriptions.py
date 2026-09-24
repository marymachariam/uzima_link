from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.dependencies import require_role
from app.repository import prescription_repository
from database import get_db

router = APIRouter(prefix="/patient/prescriptions", tags=["patient-prescriptions"])


@router.get("", response_model=list[schemas.PrescriptionOut])
def get_my_prescriptions(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    return prescription_repository.get_prescriptions_for_patient(db, user.patient_id)
