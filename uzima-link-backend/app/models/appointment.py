import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    facility_id = Column(UUID(as_uuid=True), ForeignKey("facilities.id"), nullable=False)
    slot_id = Column(UUID(as_uuid=True), ForeignKey("availability_slots.id"), nullable=False)
    scheduled_time = Column(DateTime, nullable=False, index=True)
    status = Column(String, nullable=False, default="booked")  # booked | cancelled | completed
    created_at = Column(DateTime, default=datetime.utcnow)