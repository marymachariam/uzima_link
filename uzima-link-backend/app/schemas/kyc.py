from pydantic import BaseModel
from typing import Optional


class KycStatusOut(BaseModel):
    kyc_status: Optional[str] = None
    kyc_verified: bool
    message: str


class KycDecision(BaseModel):
    approve: bool
    note: Optional[str] = None