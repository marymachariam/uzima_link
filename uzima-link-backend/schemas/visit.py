from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

from schemas.clinical_entity import ClinicalEntityOut


class VisitCreate(BaseModel):
    patient_id: int
    facility_id: Optional[int] = None
    raw_transcript: Optional[str] = None


class VisitOut(BaseModel):
    id: int
    patient_id: int
    facility_id: Optional[int] = None
    attending_doctor_name: Optional[str] = None
    source: str
    visit_date: datetime
    raw_transcript: Optional[str] = None
    english_transcript: Optional[str] = None
    swahili_transcript: Optional[str] = None
    doctor_notes: Optional[str] = None
    clinical_entities: List[ClinicalEntityOut] = []

    class Config:
        from_attributes = True


class DoctorNotesUpdate(BaseModel):
    doctor_notes: str