from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class PatientCreate(BaseModel):
    full_name: str
    date_of_birth: str
    gender: str
    phone_number: str | None = None
    id_type: str = "none"
    national_id: str | None = None
    guardian_name: str | None = None
    guardian_phone: str | None = None


class PatientOut(BaseModel):
    id: UUID
    system_uid: str
    full_name: str
    date_of_birth: str
    gender: str
    phone_number: str | None = None
    id_type: str
    national_id: str | None = None
    guardian_name: str | None = None
    guardian_phone: str | None = None
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
    phone_number: str | None = None
    national_id: str | None = None


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
    phone_number: str | None = None
    id_type: str
    national_id: str | None = None
    guardian_name: str | None = None
    guardian_phone: str | None = None
    photo_url: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class PatientProfileUpdate(BaseModel):
    full_name: str | None = None
    phone_number: str | None = None
    guardian_name: str | None = None
    guardian_phone: str | None = None


class KycStatusOut(BaseModel):
    kyc_status: str | None = None
    kyc_verified: bool
    message: str


class KycDecision(BaseModel):
    approve: bool
    note: str | None = None


class DoctorPatientView(BaseModel):
    patient: "PatientOut"
    allergies: list["AllergyOut"] = []
    visits: list["VisitOut"] = []
    prescriptions: list["PrescriptionOut"] = []


from app.schemas.allergy import AllergyOut
from app.schemas.prescription import PrescriptionOut
from app.schemas.visit import VisitOut

DoctorPatientView.model_rebuild()


class PatientProfileOut(BaseModel):
    id: UUID
    system_uid: str
    full_name: str
    date_of_birth: str
    gender: str
    phone_number: str | None = None
    id_type: str
    national_id: str | None = None
    guardian_name: str | None = None
    guardian_phone: str | None = None
    photo_url: str | None = None
    kyc_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True
