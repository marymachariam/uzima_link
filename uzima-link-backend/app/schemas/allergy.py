from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class AllergyCreate(BaseModel):
    patient_id: UUID
    allergen: str
    severity: str
    reaction: Optional[str] = None


class AllergyOut(BaseModel):
    id: UUID
    patient_id: UUID
    allergen: str
    severity: str
    reaction: Optional[str] = None

    class Config:
        from_attributes = True
    
class AllergyRecommendation(BaseModel):
    allergen: str
    severity: str
    recommendation: str