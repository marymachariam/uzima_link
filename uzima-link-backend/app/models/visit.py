import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class Visit(Base):
    __tablename__ = "visits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    facility_id = Column(UUID(as_uuid=True), ForeignKey("facilities.id"), nullable=True)
    attending_doctor_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    source = Column(String, nullable=False, default="kiosk")
    visit_date = Column(DateTime, default=datetime.utcnow)
    raw_transcript = Column(Text, nullable=True)
    english_transcript = Column(Text, nullable=True)
    swahili_transcript = Column(Text, nullable=True)
    doctor_notes = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="visits")
    facility = relationship("Facility")
    attending_doctor = relationship("User")
    clinical_entities = relationship("ClinicalEntity", back_populates="visit")
