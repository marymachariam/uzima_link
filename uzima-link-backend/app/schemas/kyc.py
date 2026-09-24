from pydantic import BaseModel


class KycStatusOut(BaseModel):
    kyc_status: str | None = None
    kyc_verified: bool
    message: str


class KycDecision(BaseModel):
    approve: bool
    note: str | None = None
