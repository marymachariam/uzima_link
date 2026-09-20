from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class ConsentGrant(BaseModel):
    facility_id: Optional[UUID] = None
    doctor_id: Optional[UUID] = None
    scope: str = "full_record"


class ConsentOut(BaseModel):
    id: UUID
    patient_id: UUID
    facility_id: Optional[UUID] = None
    doctor_id: Optional[UUID] = None
    scope: str
    granted: bool
    granted_at: datetime
    revoked_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ConsentRequestOut(BaseModel):
    id: UUID
    patient_id: UUID
    facility_id: UUID
    requested_by: UUID
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ConsentRequestDecision(BaseModel):
    approve: bool