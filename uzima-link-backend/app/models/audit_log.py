from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    action = Column(String, nullable=False)  
    resource_type = Column(String, nullable=True)  
    resource_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)