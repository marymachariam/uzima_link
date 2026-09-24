import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class Facility(Base):
    __tablename__ = "facilities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    kmhfr_code = Column(String, unique=True, index=True, nullable=True)
    ppb_registration_number = Column(String, unique=True, index=True, nullable=True)
    facility_type = Column(String, nullable=True)
    county = Column(String, nullable=True, index=True)
    sub_county = Column(String, nullable=True)

    invite_code = Column(String, unique=True, index=True, nullable=True)

    source = Column(
        String, nullable=False, default="manual"
    )  # "manual" | "kmhfr_seed" | "kmhfr_sync" | "doctor_reported"
    last_synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="facility")
