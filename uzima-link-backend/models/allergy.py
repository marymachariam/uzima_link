from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class Allergy(Base):
    __tablename__ = "allergies"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    allergen = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    reaction = Column(String, nullable=True)

    patient = relationship("Patient", back_populates="allergies")