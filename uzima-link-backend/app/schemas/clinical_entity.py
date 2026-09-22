from pydantic import BaseModel
from uuid import UUID


class ClinicalEntityOut(BaseModel):
    id: UUID
    visit_id: UUID
    entity_type: str
    description: str

    class Config:
        from_attributes = True