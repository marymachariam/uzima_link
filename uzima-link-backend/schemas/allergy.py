from pydantic import BaseModel
from typing import Optional


class AllergyCreate(BaseModel):
    patient_id: int
    allergen: str
    severity: str
    reaction: Optional[str] = None


class AllergyOut(BaseModel):
    id: int
    allergen: str
    severity: str
    reaction: Optional[str] = None

    class Config:
        from_attributes = True