from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class PrescriptionCreate(BaseModel):
    patient_id: UUID
    visit_id: Optional[UUID] = None
    medication_name: str
    dosage_instructions: Optional[str] = None
    notes: Optional[str] = None


class PrescriptionOut(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    visit_id: Optional[UUID] = None
    medication_name: str
    dosage_instructions: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True