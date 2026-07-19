from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PatientCreate(BaseModel):
    full_name: str
    date_of_birth: str
    gender: str
    phone_number: Optional[str] = None
    national_id: Optional[str] = None


class PatientOut(BaseModel):
    id: int
    system_uid: str
    full_name: str
    date_of_birth: str
    gender: str
    phone_number: Optional[str] = None
    national_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PatientListItem(BaseModel):
    id: int
    full_name: str
    system_uid: str
    last_visit: datetime
    has_allergy_alert: bool

    class Config:
        from_attributes = True
class VisitNoteItem(BaseModel):
    visit_id: int
    patient_id: int
    patient_name: str
    visit_date: datetime
    doctor_notes: str

class PatientUpdate(BaseModel):
    phone_number: Optional[str] = None
    national_id: Optional[str] = None

class PatientNotification(BaseModel):
    id: int
    full_name: str
    system_uid: str
    created_at: datetime

    class Config:
        from_attributes = True