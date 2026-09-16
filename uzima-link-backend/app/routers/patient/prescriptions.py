from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from app.core.dependencies import require_role
import app.repository.prescription_repository as prescription_repository
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/patient/prescriptions", tags=["patient-prescriptions"])


@router.get("", response_model=list[schemas.PrescriptionOut])
def get_my_prescriptions(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    return prescription_repository.get_prescriptions_for_patient(db, user.patient_id)