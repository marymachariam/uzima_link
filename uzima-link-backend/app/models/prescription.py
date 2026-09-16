from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from database import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id"), nullable=True)
    medication_name = Column(String, nullable=False)
    dosage_instructions = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")
    doctor = relationship("User")
    visit = relationship("Visit")