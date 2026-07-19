from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class ClinicalEntity(Base):
    __tablename__ = "clinical_entities"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False)
    entity_type = Column(String, nullable=False)
    description = Column(String, nullable=False)

    visit = relationship("Visit", back_populates="clinical_entities")