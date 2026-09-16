from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class FacilityOut(BaseModel):
    id: UUID
    name: str
    kmhfr_code: Optional[str] = None
    facility_type: Optional[str] = None
    county: Optional[str] = None
    sub_county: Optional[str] = None
    invite_code: Optional[str] = None
    source: str
    last_synced_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FacilityCreate(BaseModel):
    name: str
    kmhfr_code: Optional[str] = None
    facility_type: Optional[str] = None
    county: Optional[str] = None
    sub_county: Optional[str] = None