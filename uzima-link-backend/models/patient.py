from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from database import Base


def generate_uid():
    """Generates a unique system ID, e.g. UZ-8f3a1c2b"""
    return f"UZ-{uuid.uuid4().hex[:8]}"


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    system_uid = Column(String, unique=True, index=True, default=generate_uid)
    full_name = Column(String, nullable=False)
    date_of_birth = Column(String, nullable=False)
    gender = Column(String, nullable=False)
    phone_number = Column(String, unique=True, index=True, nullable=True)
    national_id = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    visits = relationship("Visit", back_populates="patient")
    allergies = relationship("Allergy", back_populates="patient")