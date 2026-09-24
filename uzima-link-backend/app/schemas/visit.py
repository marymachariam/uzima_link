from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator


class VisitCreate(BaseModel):
    patient_id: UUID
    facility_id: UUID | None = None
    attending_doctor_id: UUID | None = None
    source: str = "kiosk"
    raw_transcript: str | None = None


class VisitOut(BaseModel):
    id: UUID
    patient_id: UUID
    facility_id: UUID | None = None
    attending_doctor_id: UUID | None = None
    source: str
    visit_date: datetime
    raw_transcript: str | None = None
    english_transcript: str | None = None
    swahili_transcript: str | None = None
    doctor_notes: str | None = None

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
