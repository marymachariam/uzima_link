Backend README
markdown
# Uzima Link — Backend

AI-powered digital health records platform for hospitals and clinics in Kenya. Patients describe symptoms — typed or spoken, in English or Swahili — and AI structures the input into symptoms, conditions, and medications. That record follows the patient across any participating facility.

## Tech Stack

- **Framework:** FastAPI
- **Database:** PostgreSQL (via SQLAlchemy ORM)
- **Auth:** JWT (python-jose), bcrypt password hashing (passlib)
- **AI:** Google Gemini (transcription, translation, structured extraction)
- **Email:** Resend (password reset)
- **Testing:** pytest, httpx

## Architecture

The backend follows a layered structure:

├── main.py # App entrypoint, wires routers together
├── database.py # Engine/session setup
├── models/ # SQLAlchemy table definitions (one file per table)
├── schemas/ # Pydantic request/response shapes
├── services/ # Business logic that isn't DB CRUD (AI calls, auth, email)
├── repository/ # Database query functions
├── routers/ # API endpoints, grouped by feature
└── tests/ # pytest test suite


## Core Features

- **Four roles:** patient, kiosk_operator, doctor, admin — each with scoped permissions
- **Facility invite-code system** — staff can only register with a valid hospital invite code
- **AI pipeline:** audio/text → transcription → translation (English + Swahili) → structured extraction (symptoms/conditions/medications)
- **Allergy safety alerts** — flagged instantly on the doctor dashboard
- **Password reset** with real email delivery via Resend
- **Digital patient ID** — unique `system_uid` used for QR-code-based lookup

## Setup

1. Clone the repo and create a virtual environment:
```bash
   python3 -m venv env
   source env/bin/activate
   pip install -r requirements.txt
```

2. Create a `.env` file:

DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/uzima_link
GEMINI_API_KEY=your_gemini_key
JWT_SECRET_KEY=a_long_random_string
RESEND_API_KEY=your_resend_key
FRONTEND_URL=http://localhost:3000


3. Create the Postgres database:
```bash
   psql -h localhost -U postgres -c "CREATE DATABASE uzima_link;"
```

4. Run the server (tables are created automatically on first run):
```bash
   uvicorn main:app --reload
```

5. Seed initial facilities:
```bash
   python seed_facilities.py
```

API docs available at `http://127.0.0.1:8000/docs` once running.

## Testing

```bash
python -m pytest -v
```

31 automated tests covering authentication, authorization boundaries, the AI pipeline, allergy handling, and edge cases. AI calls are mocked in tests — no real API calls, no cost.

## Key Endpoints

| Endpoint | Description |
|---|---|
| `POST /auth/register/patient` | Patient self-registration |
| `POST /auth/register/staff` | Doctor/kiosk registration (requires invite code) |
| `POST /auth/login` | Login, returns JWT |
| `POST /auth/forgot-password` / `reset-password` | Password reset flow |
| `GET /patients/lookup` | Find a patient by phone/national ID/smart card |
| `POST /visits` / `POST /visits/audio` | Record a patient visit (text or voice) |
| `GET /patients/{id}/dashboard` | Full patient record with allergy alert |
| `POST /allergies` | Record an allergy |
| `PATCH /visits/{id}/notes` | Doctor adds clinical notes |
| `POST /admin/facilities` | Admin creates a new hospital/facility |
