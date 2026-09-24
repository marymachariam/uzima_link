from uuid import UUID

from pydantic import BaseModel


class ClinicalEntityOut(BaseModel):
    id: UUID
    visit_id: UUID
    entity_type: str
    description: str

    class Config:
        from_attributes = True
