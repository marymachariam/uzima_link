from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional
from uuid import UUID


class VisitCreate(BaseModel):
    patient_id: UUID
    facility_id: Optional[UUID] = None
    attending_doctor_id: Optional[UUID] = None
    source: str = "kiosk"
    raw_transcript: Optional[str] = None


class VisitOut(BaseModel):
    id: UUID
    patient_id: UUID
    facility_id: Optional[UUID] = None
    attending_doctor_id: Optional[UUID] = None
    source: str
    visit_date: datetime
    raw_transcript: Optional[str] = None
    english_transcript: Optional[str] = None
    swahili_transcript: Optional[str] = None
    doctor_notes: Optional[str] = None

    class Config:
        from_attributes = True


class SymptomEntryCreate(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def not_empty(cls, v):
        if not v.strip():
            raise ValueError("Symptom description cannot be empty")
        return v


class VisitNotesUpdate(BaseModel):
    doctor_notes: str
    
class DoctorNoteCreate(BaseModel):
    patient_id: UUID
    note: str