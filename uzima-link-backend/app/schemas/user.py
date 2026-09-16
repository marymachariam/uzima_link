from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID


class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    role: str
    full_name: Optional[str] = None
    facility_id: Optional[UUID] = None
    patient_id: Optional[UUID] = None
    is_verified: bool
    photo_url: Optional[str] = None
    specialty: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class StaffProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    specialty: Optional[str] = None


class StaffProfileOut(BaseModel):
    """Comprehensive staff profile — user info plus their full facility record."""
    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    is_verified: bool
    photo_url: Optional[str] = None
    specialty: Optional[str] = None
    created_at: datetime
    facility: Optional["FacilityOut"] = None

    class Config:
        from_attributes = True


from app.schemas.facility import FacilityOut
StaffProfileOut.model_rebuild()


class StaffProfileOut(BaseModel):
    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    is_verified: bool
    photo_url: Optional[str] = None
    specialty: Optional[str] = None
    kyc_verified: bool
    created_at: datetime
    facility: Optional["FacilityOut"] = None

    class Config:
        from_attributes = True