from unittest.mock import patch


def get_auth_headers(client, email, password):
    response = client.post("/auth/login", json={"email": email, "password": password})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@patch("services.ai_service.translate_text")
@patch("services.ai_service.extract_clinical_entities")
def test_visit_creation_saves_correct_patient_id(mock_extract, mock_translate, client, registered_kiosk_operator, registered_patient, facility):
    mock_translate.return_value = {"english": "I have a headache", "swahili": "Nina maumivu ya kichwa"}
    mock_extract.return_value = {"symptoms": ["headache"], "conditions": [], "medications": []}

    headers = get_auth_headers(client, "kiosk@test.com", "password123")

    response = client.post("/visits", json={
        "patient_id": 1,
        "facility_id": facility.id,
        "raw_transcript": "Nina maumivu ya kichwa"
    }, headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["patient_id"] == 1
    assert data["source"] == "kiosk"
    assert data["english_transcript"] == "I have a headache"


@patch("services.ai_service.translate_text")
@patch("services.ai_service.extract_clinical_entities")
def test_visit_extraction_saves_correct_entities(mock_extract, mock_translate, client, registered_kiosk_operator, registered_patient, facility):
    mock_translate.return_value = {"english": "headache and fever", "swahili": "maumivu ya kichwa na homa"}
    mock_extract.return_value = {"symptoms": ["headache", "fever"], "conditions": [], "medications": []}

    headers = get_auth_headers(client, "kiosk@test.com", "password123")

    response = client.post("/visits", json={
        "patient_id": 1,
        "facility_id": facility.id,
        "raw_transcript": "test"
    }, headers=headers)

    data = response.json()
    symptom_names = [e["description"] for e in data["clinical_entities"] if e["entity_type"] == "symptom"]
    assert "headache" in symptom_names
    assert "fever" in symptom_names


def test_patient_self_report_has_no_facility(client, registered_patient, facility):
    headers = get_auth_headers(client, "patient@test.com", "password123")

    response = client.post("/visits", json={
        "patient_id": 1,
        "raw_transcript": "I feel dizzy today"
    }, headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "self_reported"
    assert data["facility_id"] is None


def test_kiosk_visit_without_facility_id_rejected(client, registered_kiosk_operator, registered_patient):
    headers = get_auth_headers(client, "kiosk@test.com", "password123")

    response = client.post("/visits", json={
        "patient_id": 1,
        "raw_transcript": "test complaint"
        # no facility_id
    }, headers=headers)

    assert response.status_code == 400


def test_duplicate_allergy_rejected(client, registered_kiosk_operator, registered_patient):
    headers = get_auth_headers(client, "kiosk@test.com", "password123")

    first = client.post("/allergies", json={
        "patient_id": 1,
        "allergen": "Penicillin",
        "severity": "Severe",
        "reaction": "Anaphylaxis"
    }, headers=headers)
    assert first.status_code == 200

    second = client.post("/allergies", json={
        "patient_id": 1,
        "allergen": "Penicillin",
        "severity": "Mild",
    }, headers=headers)
    assert second.status_code == 400


def test_dashboard_shows_allergy_alert_correctly(client, registered_kiosk_operator, registered_doctor, registered_patient):
    kiosk_headers = get_auth_headers(client, "kiosk@test.com", "password123")
    client.post("/allergies", json={
        "patient_id": 1,
        "allergen": "Latex",
        "severity": "Moderate",
    }, headers=kiosk_headers)

    doctor_headers = get_auth_headers(client, "doctor@test.com", "password123")
    response = client.get("/patients/1/dashboard", headers=doctor_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["allergy_alert"] is True
    assert len(data["allergies"]) == 1
    assert data["allergies"][0]["allergen"] == "Latex"