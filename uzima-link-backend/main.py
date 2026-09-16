from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from apscheduler.schedulers.background import BackgroundScheduler

from database import Base, engine, SessionLocal
from app.core.limiter import limiter
import app.models  # noqa: F401
import app.services.kmhfr_sync_service as kmhfr_sync_service

from app.routers.auth.patient import router as patient_auth_router
from app.routers.auth.doctor import router as doctor_auth_router
from app.routers.auth.frontdesk import router as frontdesk_auth_router
from app.routers.auth.verification import router as auth_verification_router
from app.routers.doctor.kyc import router as doctor_kyc_router
from app.routers.patient.profile import router as patient_profile_router
from app.routers.patient.symptoms import router as patient_symptoms_router
from app.routers.patient.allergies import router as patient_allergies_router
from app.routers.patient.health_card import router as patient_health_card_router
from app.routers.patient.medicine import router as patient_medicine_router
from app.routers.patient.kyc import router as patient_kyc_router
from app.routers.patient.consent import router as patient_consent_router
from app.routers.patient.prescriptions import router as patient_prescriptions_router
from app.routers.doctor.profile import router as doctor_profile_router
from app.routers.doctor.patient_records import router as doctor_patient_records_router
from app.routers.doctor.visits import router as doctor_visits_router
from app.routers.doctor.consultation import router as doctor_consultation_router
from app.routers.doctor.prescriptions import router as doctor_prescriptions_router
from app.routers.doctor.queue import router as doctor_queue_router
from app.routers.frontdesk.profile import router as frontdesk_profile_router
from app.routers.frontdesk.patients import router as frontdesk_patients_router
from app.routers.frontdesk.checkin import router as frontdesk_checkin_router
from app.routers.frontdesk.queue import router as frontdesk_queue_router
from app.routers.shared.admin import router as shared_admin_router

app = FastAPI(title="Uzima Link API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# Auth — all together, registered first
app.include_router(patient_auth_router)
app.include_router(doctor_auth_router)
app.include_router(frontdesk_auth_router)
app.include_router(auth_verification_router)

# Everything else
app.include_router(patient_profile_router)
app.include_router(patient_symptoms_router)
app.include_router(patient_allergies_router)
app.include_router(patient_health_card_router)
app.include_router(patient_medicine_router)
app.include_router(patient_kyc_router)
app.include_router(patient_consent_router)
app.include_router(patient_prescriptions_router)
app.include_router(doctor_profile_router)
app.include_router(doctor_patient_records_router)
app.include_router(doctor_visits_router)
app.include_router(doctor_consultation_router)
app.include_router(doctor_prescriptions_router)
app.include_router(doctor_queue_router)
app.include_router(frontdesk_profile_router)
app.include_router(frontdesk_patients_router)
app.include_router(frontdesk_checkin_router)
app.include_router(frontdesk_queue_router)
app.include_router(shared_admin_router)
app.include_router(doctor_kyc_router)

scheduler = BackgroundScheduler()


def run_facility_sync():
    db = SessionLocal()
    try:
        kmhfr_sync_service.sync_facilities_from_kmhfr(db)
    finally:
        db.close()


@app.on_event("startup")
def start_scheduler():
    scheduler.add_job(run_facility_sync, "interval", days=1, id="kmhfr_sync", replace_existing=True)
    scheduler.start()


@app.on_event("shutdown")
def stop_scheduler():
    scheduler.shutdown()


@app.get("/health")
def health_check():
    return {"status": "ok"}