from pydantic import BaseModel
from typing import Optional


class DrugInfoOut(BaseModel):
    query: str
    found: bool
    generic_name: Optional[str] = None
    brand_name: Optional[str] = None
    purpose: Optional[str] = None
    warnings: Optional[str] = None
    dosage_info: Optional[str] = None
    source: Optional[str] = None
    note: str
    video_url: Optional[str] = None