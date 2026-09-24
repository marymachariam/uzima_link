from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr


class InviteStaffRequest(BaseModel):
    email: EmailStr
    full_name: str
    role: Literal["doctor", "kiosk_operator"]
    facility_kmhfr_code: str | None = None
    facility_registration_number: str | None = None


class StaffInviteOut(BaseModel):
    message: str
    facility_name: str


class AdminPatientKycOut(BaseModel):
    id: UUID
    system_uid: str
    full_name: str
    national_id: str | None = None
    phone_number: str | None = None
    kyc_status: str | None = None
    kyc_selfie_url: str | None = None
    kyc_id_document_url: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class AdminDoctorKycOut(BaseModel):
    id: UUID
    full_name: str | None = None
    email: EmailStr
    national_id: str | None = None
    phone_number: str | None = None
    kyc_status: str | None = None
    kyc_selfie_url: str | None = None
    kyc_id_document_url: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
