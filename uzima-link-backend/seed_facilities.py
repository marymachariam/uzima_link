from database import SessionLocal
import models

db = SessionLocal()

facilities = [
    {"name": "Nairobi Test Clinic", "invite_code": "NAIROBI2026"},
    {"name": "Kisumu Test Clinic", "invite_code": "KISUMU2026"},
]

for f in facilities:
    existing = db.query(models.Facility).filter(models.Facility.invite_code == f["invite_code"]).first()
    if not existing:
        db.add(models.Facility(**f))

db.commit()
db.close()
print("Facilities seeded.")