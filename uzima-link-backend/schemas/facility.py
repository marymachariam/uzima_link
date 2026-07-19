from pydantic import BaseModel
from datetime import datetime


class FacilityOut(BaseModel):
    id: int
    name: str
    invite_code: str
    created_at: datetime

    class Config:
        from_attributes = True

class FacilityCreate(BaseModel):
    name: str
    invite_code: str        