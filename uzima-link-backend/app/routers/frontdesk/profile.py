from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
from app.core.dependencies import require_role
import app.repository.user_repository as user_repository
import app.services.cloudinary_service as cloudinary_service
import app.models as models
import app.schemas as schemas

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
    return user_repository.update_user_profile(db, user, full_name=data.full_name, specialty=data.specialty)


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