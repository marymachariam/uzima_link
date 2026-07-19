from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=True)
    attending_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
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