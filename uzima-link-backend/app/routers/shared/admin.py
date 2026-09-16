import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from app.core.admin_auth import require_admin_key
import app.repository.facility_repository as facility_repository
import app.schemas as schemas

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/facilities/{facility_id}/generate-invite-code", response_model=schemas.FacilityOut)
def generate_invite_code(
    facility_id: str,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin_key),
):
    facility = facility_repository.get_facility_by_id(db, facility_id)
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")

    invite_code = secrets.token_urlsafe(8)
    return facility_repository.generate_invite_code_for_facility(db, facility, invite_code)


@router.post("/facilities", response_model=schemas.FacilityOut)
def create_facility_manual(
    data: schemas.FacilityCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin_key),
):
    return facility_repository.create_facility(
        db, name=data.name, kmhfr_code=data.kmhfr_code,
        facility_type=data.facility_type, county=data.county, sub_county=data.sub_county, source="manual"
    )