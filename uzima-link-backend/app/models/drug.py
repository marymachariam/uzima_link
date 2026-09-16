from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from database import Base


class Drug(Base):
    __tablename__ = "drugs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    query_name = Column(String, unique=True, index=True, nullable=False)  
    generic_name = Column(String, nullable=True)
    brand_name = Column(String, nullable=True)
    purpose = Column(Text, nullable=True)
    warnings = Column(Text, nullable=True)
    dosage_info = Column(Text, nullable=True)
    source = Column(String, nullable=False, default="openfda")
    fetched_at = Column(DateTime, default=datetime.utcnow)