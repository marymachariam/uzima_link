import uuid

from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class ClinicalEntity(Base):
    __tablename__ = "clinical_entities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id"), nullable=False)
    entity_type = Column(String, nullable=False)
    description = Column(String, nullable=False)

    visit = relationship("Visit", back_populates="clinical_entities")
