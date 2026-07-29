def test_patient_can_register(client, facility):
    response = client.post("/auth/register/patient", json={
        "full_name": "Jane Doe",
        "date_of_birth": "01-01-1990",
        "gender": "female",
        "phone_number": "0700111222",
        "national_id": "20000001",
        "email": "jane@test.com",
        "password": "password123",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "patient"
    assert "access_token" in data


def test_duplicate_phone_number_rejected(client, facility):
    client.post("/auth/register/patient", json={
        "full_name": "First Patient",
        "date_of_birth": "01-01-1990",
        "gender": "female",
        "phone_number": "0700111222",
        "national_id": "20000001",
        "email": "first@test.com",
        "password": "password123",
    })
    response = client.post("/auth/register/patient", json={
        "full_name": "Second Patient",
        "date_of_birth": "01-01-1990",
        "gender": "male",
        "phone_number": "0700111222",  # same phone number
        "national_id": "20000002",
        "email": "second@test.com",
        "password": "password123",
    })
    assert response.status_code == 400


def test_staff_registration_requires_valid_invite_code(client, facility):
    response = client.post("/auth/register/staff", json={
        "full_name": "Fake Doctor",
        "email": "fake@test.com",
        "password": "password123",
        "role": "doctor",
        "invite_code": "WRONGCODE123",
    })
    assert response.status_code == 400


def test_login_with_wrong_password_rejected(client, registered_patient):
    response = client.post("/auth/login", json={
        "email": "patient@test.com",
        "password": "wrongpassword",
    })
    assert response.status_code == 401


def test_login_with_correct_password_succeeds(client, registered_patient):
    response = client.post("/auth/login", json={
        "email": "patient@test.com",
        "password": "password123",
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_patient_cannot_access_doctor_dashboard(client, registered_patient, registered_doctor):
    # Try to view a doctor-only-style request using a patient's own token,
    # against a different patient_id than their own
    token = registered_patient["access_token"]
    response = client.get(
        "/patients/999/dashboard",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code in (403, 404)


def test_kiosk_operator_cannot_write_doctor_notes(client, registered_kiosk_operator, registered_patient):
    kiosk_token = registered_kiosk_operator["access_token"]

    # Kiosk creates a visit first, since notes need an existing visit
    visit_response = client.post(
        "/visits",
        json={"patient_id": 1, "facility_id": 1, "raw_transcript": "test complaint"},
        headers={"Authorization": f"Bearer {kiosk_token}"}
    )
    # This may fail depending on patient_id/facility_id assumptions — see note below
    # We mainly want to confirm kiosk operators are blocked from the notes endpoint itself
    response = client.patch(
        "/visits/1/notes",
        json={"doctor_notes": "unauthorized note"},
        headers={"Authorization": f"Bearer {kiosk_token}"}
    )
    assert response.status_code == 403


def test_no_token_rejected_from_protected_endpoint(client):
    response = client.get("/patients/1/dashboard")
    assert response.status_code == 401


def test_invalid_token_rejected(client):
    response = client.get(
        "/patients/1/dashboard",
        headers={"Authorization": "Bearer totally.fake.token"}
    )
    assert response.status_code == 401