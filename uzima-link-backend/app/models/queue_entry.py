import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class QueueEntry(Base):
    __tablename__ = "queue_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    patient_id = Column(
        UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True
    )
    facility_id = Column(
        UUID(as_uuid=True), ForeignKey("facilities.id"), nullable=False, index=True
    )
    assigned_doctor_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    status = Column(String, nullable=False, default="waiting")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient")
    facility = relationship("Facility")
    assigned_doctor = relationship("User")
