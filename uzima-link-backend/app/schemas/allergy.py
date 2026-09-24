from uuid import UUID

from pydantic import BaseModel


class AllergyCreate(BaseModel):
    patient_id: UUID | None = None  # set by the server from the logged-in user
    allergen: str
    severity: str
    reaction: str | None = None


class AllergyOut(BaseModel):
    id: UUID
    patient_id: UUID
    allergen: str
    severity: str
    reaction: str | None = None

    class Config:
        from_attributes = True


class AllergyRecommendation(BaseModel):
    allergen: str
    severity: str
    recommendation: str
