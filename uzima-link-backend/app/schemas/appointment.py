from datetime import datetime, timezone
from uuid import UUID

from pydantic import BaseModel, field_validator, model_validator


class SlotCreate(BaseModel):
    start_time: datetime
    end_time: datetime

    @field_validator("start_time", "end_time")
    @classmethod
    def to_naive_utc(cls, v: datetime):
        # the DB stores naive UTC (same as datetime.utcnow elsewhere)
        if v.tzinfo is not None:
            v = v.astimezone(timezone.utc).replace(tzinfo=None)
        return v

    @model_validator(mode="after")
    def check_range(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        if self.start_time < datetime.utcnow():
            raise ValueError("Slot must be in the future")
        return self


class SlotOut(BaseModel):
    id: UUID
    doctor_id: UUID
    facility_id: UUID
    start_time: datetime
    end_time: datetime
    is_booked: bool

    class Config:
        from_attributes = True


class AppointmentBook(BaseModel):
    slot_id: UUID


class AppointmentOut(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    facility_id: UUID
    slot_id: UUID
    scheduled_time: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
        
class DoctorListOut(BaseModel):
    id: UUID
    full_name: str | None = None
    specialty: str | None = None
    facility_id: UUID | None = None
    facility_name: str | None = None
    
class FacilityListOut(BaseModel):
    id: UUID
    name: str
    facility_type: str | None = None
    county: str | None = None

    class Config:
        from_attributes = True
        
    end_time: datetime | None = None
    doctor_name: str | None = None
    doctor_specialty: str | None = None
    facility_name: str | None = None
    patient_name: str | None = None