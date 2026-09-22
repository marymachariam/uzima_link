import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database import Base, get_db
import app.models as models

TEST_DATABASE_URL = "sqlite:///./test_uzima_link.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def facility(db_session):
    facility = models.Facility(name="Test Clinic", invite_code="TESTCODE123")
    db_session.add(facility)
    db_session.commit()
    db_session.refresh(facility)
    return facility


@pytest.fixture
def registered_patient(client):
    response = client.post("/auth/register/patient", json={
        "full_name": "Test Patient",
        "date_of_birth": "01-01-2000",
        "gender": "female",
        "phone_number": "0700000001",
        "national_id": "10000001",
        "email": "patient@test.com",
        "password": "password123",
    })
    return response.json()


@pytest.fixture
def registered_doctor(client, facility):
    response = client.post("/auth/register/staff", json={
        "full_name": "Test Doctor",
        "email": "doctor@test.com",
        "password": "password123",
        "role": "doctor",
        "invite_code": facility.invite_code,
    })
    return response.json()


@pytest.fixture
def registered_kiosk_operator(client, facility):
    response = client.post("/auth/register/staff", json={
        "full_name": "Test Kiosk",
        "email": "kiosk@test.com",
        "password": "password123",
        "role": "kiosk_operator",
        "invite_code": facility.invite_code,
    })
    return response.json()