def get_auth_headers(client, email, password):
    response = client.post("/auth/login", json={"email": email, "password": password})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_kiosk_operator_can_add_allergy_for_patient(client, registered_kiosk_operator, registered_patient):
    headers = get_auth_headers(client, "kiosk@test.com", "password123")
    response = client.post("/allergies", json={
        "patient_id": 1,
        "allergen": "Peanuts",
        "severity": "Severe",
        "reaction": "Swelling",
    }, headers=headers)
    assert response.status_code == 200
    assert response.json()["allergen"] == "Peanuts"


def test_doctor_can_add_allergy_for_patient(client, registered_doctor, registered_patient):
    headers = get_auth_headers(client, "doctor@test.com", "password123")
    response = client.post("/allergies", json={
        "patient_id": 1,
        "allergen": "Aspirin",
        "severity": "Moderate",
    }, headers=headers)
    assert response.status_code == 200


def test_patient_can_add_their_own_allergy(client, registered_patient):
    headers = get_auth_headers(client, "patient@test.com", "password123")
    response = client.post("/allergies", json={
        "patient_id": 1,
        "allergen": "Shellfish",
        "severity": "Mild",
    }, headers=headers)
    assert response.status_code == 200


def test_patient_cannot_add_allergy_for_another_patient(client, registered_patient, facility):
    # Create a second patient directly through registration
    client_response = client.post("/auth/register/patient", json={
        "full_name": "Other Patient",
        "date_of_birth": "01-01-1985",
        "gender": "male",
        "phone_number": "0799999999",
        "national_id": "40000001",
        "email": "other@test.com",
        "password": "password123",
    })
    assert client_response.status_code == 200

    # Log in as the FIRST patient, try adding an allergy for the SECOND patient (id 2)
    headers = get_auth_headers(client, "patient@test.com", "password123")
    response = client.post("/allergies", json={
        "patient_id": 2,
        "allergen": "Suspicious entry",
        "severity": "Mild",
    }, headers=headers)
    assert response.status_code == 403


def test_allergy_for_nonexistent_patient_rejected(client, registered_kiosk_operator):
    headers = get_auth_headers(client, "kiosk@test.com", "password123")
    response = client.post("/allergies", json={
        "patient_id": 99999,
        "allergen": "Ghost allergy",
        "severity": "Mild",
    }, headers=headers)
    assert response.status_code == 404


def test_unauthenticated_request_rejected(client, registered_patient):
    response = client.post("/allergies", json={
        "patient_id": 1,
        "allergen": "No token",
        "severity": "Mild",
    })
    assert response.status_code == 401


def test_allergy_appears_on_patient_own_dashboard(client, registered_patient):
    headers = get_auth_headers(client, "patient@test.com", "password123")
    client.post("/allergies", json={
        "patient_id": 1,
        "allergen": "Dust",
        "severity": "Mild",
    }, headers=headers)

    response = client.get("/patients/1/dashboard", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["allergy_alert"] is True
    assert any(a["allergen"] == "Dust" for a in data["allergies"])