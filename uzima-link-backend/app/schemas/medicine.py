from pydantic import BaseModel
from typing import Optional


class MedicineCheckRequest(BaseModel):
    query: str  
    query_type: str = "name" 


class MedicineCheckResult(BaseModel):
    query: str
    found: bool
    drug_name: Optional[str] = None
    summary: Optional[str] = None
    warning: Optional[str] = None