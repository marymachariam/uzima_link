import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


def generate_uid():
    return f"UZ-{uuid.uuid4().hex[:8]}"


class Patient(Base):
    __tablename__ = "patients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    system_uid = Column(String, unique=True, index=True, default=generate_uid)
    full_name = Column(String, nullable=False)
    date_of_birth = Column(String, nullable=False)
    gender = Column(String, nullable=False)

    phone_number = Column(String, unique=True, index=True, nullable=False)
    phone_verified = Column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    id_type = Column(String, nullable=False, default="none")
    national_id = Column(String, unique=True, index=True, nullable=True)

    guardian_name = Column(String, nullable=True)
    guardian_phone = Column(String, nullable=True)

    photo_url = Column(String, nullable=True)

    kyc_status = Column(String, nullable=True)
    kyc_selfie_url = Column(String, nullable=True)
    kyc_verified = Column(Boolean, nullable=False, default=False)
    kyc_verified_at = Column(DateTime, nullable=True)
    kyc_reviewed_by_note = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    visits = relationship("Visit", back_populates="patient")
    allergies = relationship("Allergy", back_populates="patient")
