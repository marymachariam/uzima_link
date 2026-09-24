from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class FacilityOut(BaseModel):
    id: UUID
    name: str
    kmhfr_code: str | None = None
    facility_type: str | None = None
    county: str | None = None
    sub_county: str | None = None
    invite_code: str | None = None
    source: str
    last_synced_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class FacilityCreate(BaseModel):
    name: str
    kmhfr_code: str | None = None
    facility_type: str | None = None
    county: str | None = None
    sub_county: str | None = None
