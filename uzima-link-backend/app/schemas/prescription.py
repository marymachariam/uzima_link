from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class PrescriptionCreate(BaseModel):
    patient_id: UUID
    visit_id: UUID | None = None
    medication_name: str
    dosage_instructions: str | None = None
    notes: str | None = None


class PrescriptionOut(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    visit_id: UUID | None = None
    medication_name: str
    dosage_instructions: str | None = None
    notes: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
