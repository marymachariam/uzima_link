from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    facility_id = Column(UUID(as_uuid=True), ForeignKey("facilities.id"), nullable=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    photo_url = Column(String, nullable=True)
    specialty = Column(String, nullable=True)

    reset_token = Column(String, unique=True, index=True, nullable=True)
    reset_token_expires_at = Column(DateTime, nullable=True)

    email_verification_token = Column(String, unique=True, index=True, nullable=True)
    email_verification_expires_at = Column(DateTime, nullable=True)

    login_otp_hash = Column(String, nullable=True)
    login_otp_expires_at = Column(DateTime, nullable=True)

    kyc_status = Column(String, nullable=True)  # None | "pending" | "approved" | "rejected"
    kyc_selfie_url = Column(String, nullable=True)
    kyc_id_document_url = Column(String, nullable=True)
    kyc_verified = Column(Boolean, nullable=False, default=False)
    kyc_verified_at = Column(DateTime, nullable=True)
    kyc_reviewed_by_note = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    facility = relationship("Facility", back_populates="users")
    patient = relationship("Patient")