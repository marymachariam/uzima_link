from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import repository.patient_repository as patient_repository
import repository.allergy_repository as allergy_repository
import schemas
import models
from routers.dependencies import get_current_user

router = APIRouter(prefix="/allergies", tags=["allergies"])


@router.post("", response_model=schemas.AllergyOut)
def create_allergy(
    allergy: schemas.AllergyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    is_staff = current_user.role in ("doctor", "kiosk_operator")
    is_self = current_user.role == "patient" and current_user.patient_id == allergy.patient_id

    if not is_staff and not is_self:
        raise HTTPException(status_code=403, detail="Not authorized to record this allergy")

    patient = patient_repository.get_patient_by_id(db, allergy.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    existing = allergy_repository.get_allergy_by_patient_and_allergen(db, allergy.patient_id, allergy.allergen)
    if existing:
        raise HTTPException(status_code=400, detail=f"Patient already has an allergy record for {allergy.allergen}")

    return allergy_repository.create_allergy(db, allergy.patient_id, allergy.allergen, allergy.severity, allergy.reaction)