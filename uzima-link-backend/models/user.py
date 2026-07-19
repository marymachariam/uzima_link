from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    facility = relationship("Facility")
    patient = relationship("Patient")