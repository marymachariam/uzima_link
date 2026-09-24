from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.dependencies import require_role
from app.repository import user_repository
from app.services import cloudinary_service
from database import get_db

router = APIRouter(prefix="/frontdesk/profile", tags=["frontdesk-profile"])


@router.get("/me", response_model=schemas.StaffProfileOut)
def get_my_profile(user: models.User = Depends(require_role("kiosk_operator"))):
    return user


@router.patch("/me", response_model=schemas.StaffProfileOut)
def update_my_profile(
    data: schemas.StaffProfileUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("kiosk_operator")),
):
    return user_repository.update_user_profile(
        db, user, full_name=data.full_name, specialty=data.specialty
    )


@router.post("/me/photo", response_model=schemas.StaffProfileOut)
def upload_my_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("kiosk_operator")),
):
    if file.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(status_code=400, detail="Photo must be a JPEG or PNG image")

    photo_url = cloudinary_service.upload_staff_photo(file.file, str(user.id))
    return user_repository.update_user_profile(db, user, photo_url=photo_url)
