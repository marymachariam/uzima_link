from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ConsentGrant(BaseModel):
    facility_id: UUID | None = None
    doctor_id: UUID | None = None
    scope: str = "full_record"


class ConsentOut(BaseModel):
    id: UUID
    patient_id: UUID
    facility_id: UUID | None = None
    doctor_id: UUID | None = None
    scope: str
    granted: bool
    granted_at: datetime
    revoked_at: datetime | None = None

    class Config:
        from_attributes = True


class ConsentRequestOut(BaseModel):
    id: UUID
    patient_id: UUID
    facility_id: UUID
    requested_by: UUID
    status: str
    created_at: datetime
    resolved_at: datetime | None = None

    class Config:
        from_attributes = True


class ConsentRequestDecision(BaseModel):
    approve: bool
