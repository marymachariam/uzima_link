from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime


class InviteStaffRequest(BaseModel):
    email: EmailStr
    full_name: str
    role: Literal["doctor", "kiosk_operator"]
    facility_kmhfr_code: Optional[str] = None
    facility_registration_number: Optional[str] = None


class StaffInviteOut(BaseModel):
    message: str
    facility_name: str


class AdminPatientKycOut(BaseModel):
    id: UUID
    system_uid: str
    full_name: str
    national_id: Optional[str] = None
    phone_number: Optional[str] = None
    kyc_status: Optional[str] = None
    kyc_selfie_url: Optional[str] = None
    kyc_id_document_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AdminDoctorKycOut(BaseModel):
    id: UUID
    full_name: Optional[str] = None
    email: EmailStr
    national_id: Optional[str] = None
    phone_number: Optional[str] = None
    kyc_status: Optional[str] = None
    kyc_selfie_url: Optional[str] = None
    kyc_id_document_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True