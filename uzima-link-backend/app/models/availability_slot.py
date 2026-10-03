import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class AvailabilitySlot(Base):
    __tablename__ = "availability_slots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    facility_id = Column(UUID(as_uuid=True), ForeignKey("facilities.id"), nullable=False)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)
    is_booked = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)