from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class QueueEntryCreate(BaseModel):
    patient_id: UUID


class QueueAssign(BaseModel):
    doctor_id: UUID


class QueueEntryOut(BaseModel):
    id: UUID
    patient_id: UUID
    facility_id: UUID
    assigned_doctor_id: Optional[UUID] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True