from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from app.core.dependencies import require_role
import app.repository.allergy_repository as allergy_repository
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/patient/allergies", tags=["patient-allergies"])


def _build_recommendation(severity: str) -> str:
    if severity == "severe":
        return "This is marked as a severe allergy. Always carry your health card, inform every doctor before treatment, and consider carrying emergency medication (e.g. an epinephrine auto-injector) if prescribed."
    if severity == "moderate":
        return "Inform your doctor about this allergy before any new prescription. Watch for reactions and seek care if symptoms worsen."
    return "Mention this allergy during checkups so it stays on your medical record."


@router.post("", response_model=schemas.AllergyOut)
def add_allergy(
    data: schemas.AllergyCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    if data.patient_id != user.patient_id:
        raise HTTPException(status_code=403, detail="You can only add allergies to your own record")

    return allergy_repository.create_allergy(
        db, patient_id=user.patient_id, allergen=data.allergen,
        severity=data.severity, reaction=data.reaction
    )


@router.get("", response_model=list[schemas.AllergyOut])
def get_my_allergies(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    return allergy_repository.get_allergies_for_patient(db, user.patient_id)


@router.delete("/{allergy_id}")
def remove_allergy(
    allergy_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    allergy = allergy_repository.get_allergy_by_id(db, allergy_id)
    if not allergy or allergy.patient_id != user.patient_id:
        raise HTTPException(status_code=404, detail="Allergy not found")

    allergy_repository.delete_allergy(db, allergy)
    return {"message": "Allergy removed"}


@router.get("/recommendations", response_model=list[schemas.AllergyRecommendation])
def get_my_recommendations(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    allergies = allergy_repository.get_allergies_for_patient(db, user.patient_id)
    return [
        schemas.AllergyRecommendation(
            allergen=a.allergen,
            severity=a.severity,
            recommendation=_build_recommendation(a.severity),
        )
        for a in allergies
    ]