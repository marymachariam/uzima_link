from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class PatientCreate(BaseModel):
    full_name: str
    date_of_birth: str
    gender: str
    phone_number: Optional[str] = None
    id_type: str = "none"
    national_id: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None


class PatientOut(BaseModel):
    id: UUID
    system_uid: str
    full_name: str
    date_of_birth: str
    gender: str
    phone_number: Optional[str] = None
    id_type: str
    national_id: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PatientListItem(BaseModel):
    id: UUID
    full_name: str
    system_uid: str
    last_visit: datetime
    has_allergy_alert: bool

    class Config:
        from_attributes = True


class VisitNoteItem(BaseModel):
    visit_id: UUID
    patient_id: UUID
    patient_name: str
    visit_date: datetime
    doctor_notes: str


class PatientUpdate(BaseModel):
    phone_number: Optional[str] = None
    national_id: Optional[str] = None


class PatientNotification(BaseModel):
    id: UUID
    full_name: str
    system_uid: str
    created_at: datetime

    class Config:
        from_attributes = True


class PatientProfileOut(BaseModel):
    id: UUID
    system_uid: str
    full_name: str
    date_of_birth: str
    gender: str
    phone_number: Optional[str] = None
    id_type: str
    national_id: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PatientProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None


class KycStatusOut(BaseModel):
    kyc_status: Optional[str] = None
    kyc_verified: bool
    message: str


class KycDecision(BaseModel):
    approve: bool
    note: Optional[str] = None


class DoctorPatientView(BaseModel):
    patient: "PatientOut"
    allergies: list["AllergyOut"] = []
    visits: list["VisitOut"] = []


from app.schemas.allergy import AllergyOut
from app.schemas.visit import VisitOut
DoctorPatientView.model_rebuild()

class PatientProfileOut(BaseModel):
    id: UUID
    system_uid: str
    full_name: str
    date_of_birth: str
    gender: str
    phone_number: Optional[str] = None
    id_type: str
    national_id: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    photo_url: Optional[str] = None
    kyc_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True