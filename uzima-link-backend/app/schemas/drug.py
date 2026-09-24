from pydantic import BaseModel


class DrugInfoOut(BaseModel):
    query: str
    found: bool
    generic_name: str | None = None
    brand_name: str | None = None
    purpose: str | None = None
    warnings: str | None = None
    dosage_info: str | None = None
    source: str | None = None
    note: str
    video_url: str | None = None
