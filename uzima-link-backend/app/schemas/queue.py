from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class QueueEntryCreate(BaseModel):
    patient_id: UUID


class QueueAssign(BaseModel):
    doctor_id: UUID


class QueueEntryOut(BaseModel):
    id: UUID
    patient_id: UUID
    patient_name: str | None = None
    patient_system_uid: str | None = None
    facility_id: UUID
    assigned_doctor_id: UUID | None = None
    status: str
    created_at: datetime
    updated_at: datetime
