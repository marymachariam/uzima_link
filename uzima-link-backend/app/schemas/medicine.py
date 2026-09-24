from pydantic import BaseModel


class MedicineCheckRequest(BaseModel):
    query: str
    query_type: str = "name"


class MedicineCheckResult(BaseModel):
    query: str
    found: bool
    drug_name: str | None = None
    summary: str | None = None
    warning: str | None = None
