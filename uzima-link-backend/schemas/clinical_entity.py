from pydantic import BaseModel


class ClinicalEntityOut(BaseModel):
    id: int
    entity_type: str
    description: str

    class Config:
        from_attributes = True