from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    role: str
    full_name: str | None = None
    facility_id: UUID | None = None
    patient_id: UUID | None = None
    is_verified: bool
    photo_url: str | None = None
    specialty: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class StaffProfileUpdate(BaseModel):
    full_name: str | None = None
    specialty: str | None = None


class StaffProfileOut(BaseModel):
    """Comprehensive staff profile — user info plus their full facility record."""

    id: UUID
    email: EmailStr
    full_name: str | None = None
    role: str
    is_verified: bool
    photo_url: str | None = None
    specialty: str | None = None
    created_at: datetime
    facility: Optional["FacilityOut"] = None

    class Config:
        from_attributes = True


from app.schemas.facility import FacilityOut

StaffProfileOut.model_rebuild()


class StaffProfileOut(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str | None = None
    role: str
    is_verified: bool
    photo_url: str | None = None
    specialty: str | None = None
    kyc_verified: bool
    created_at: datetime
    facility: Optional["FacilityOut"] = None

    class Config:
        from_attributes = True
