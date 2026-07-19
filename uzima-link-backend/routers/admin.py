from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import repository.facility_repository as facility_repository
import schemas
import models
from routers.dependencies import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.post("/facilities", response_model=schemas.FacilityOut)
def create_facility(
    facility: schemas.FacilityCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    existing = facility_repository.get_facility_by_invite_code(db, facility.invite_code)
    if existing:
        raise HTTPException(status_code=400, detail="That invite code is already in use")

    return facility_repository.create_facility(db, facility.name, facility.invite_code)


@router.get("/facilities", response_model=list[schemas.FacilityOut])
def list_facilities(
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    return facility_repository.get_all_facilities(db)