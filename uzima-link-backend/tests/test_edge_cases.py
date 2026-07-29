def get_auth_headers(client, email, password):
    response = client.post("/auth/login", json={"email": email, "password": password})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_registration_with_short_password_rejected(client, facility):
    response = client.post("/auth/register/patient", json={
        "full_name": "Test User",
        "date_of_birth": "01-01-1990",
        "gender": "male",
        "phone_number": "0711111111",
        "national_id": "30000001",
        "email": "shortpw@test.com",
        "password": "abc",  # too short
    })
    assert response.status_code == 422


def test_registration_with_invalid_email_rejected(client, facility):
    response = client.post("/auth/register/patient", json={
        "full_name": "Test User",
        "date_of_birth": "01-01-1990",
        "gender": "male",
        "phone_number": "0711111112",
        "national_id": "30000002",
        "email": "not-an-email",
        "password": "password123",
    })
    assert response.status_code == 422


def test_registration_missing_required_field_rejected(client, facility):
    response = client.post("/auth/register/patient", json={
        "full_name": "Test User",
        # missing date_of_birth
        "gender": "male",
        "email": "missing@test.com",
        "password": "password123",
    })
    assert response.status_code == 422


def test_visit_with_nonexistent_patient_rejected(client, registered_kiosk_operator, facility):
    headers = get_auth_headers(client, "kiosk@test.com", "password123")
    response = client.post("/visits", json={
        "patient_id": 99999,
        "facility_id": facility.id,
        "raw_transcript": "test"
    }, headers=headers)
    assert response.status_code == 404


def test_staff_registration_with_invalid_role_rejected(client, facility):
    response = client.post("/auth/register/staff", json={
        "full_name": "Sneaky User",
        "email": "sneaky@test.com",
        "password": "password123",
        "role": "admin",  # not allowed via public registration
        "invite_code": facility.invite_code,
    })
    assert response.status_code == 400


def test_password_reset_with_invalid_token_rejected(client):
    response = client.post("/auth/reset-password", json={
        "token": "totally-fake-token-that-does-not-exist",
        "new_password": "newpassword123",
    })
    assert response.status_code == 400


def test_forgot_password_does_not_reveal_whether_email_exists(client, registered_patient):
    real_email_response = client.post("/auth/forgot-password", json={"email": "patient@test.com"})
    fake_email_response = client.post("/auth/forgot-password", json={"email": "doesnotexist@test.com"})

    # Both should return the same generic message and status, regardless of whether the account exists
    assert real_email_response.status_code == fake_email_response.status_code == 200
    assert real_email_response.json()["message"] == fake_email_response.json()["message"]


def test_empty_complaint_text_rejected(client, registered_kiosk_operator, registered_patient, facility):
    headers = get_auth_headers(client, "kiosk@test.com", "password123")
    response = client.post("/visits", json={
        "patient_id": 1,
        "facility_id": facility.id,
        "raw_transcript": ""
    }, headers=headers)
    # Empty string is technically valid per our schema (Optional[str]) —
    # this test documents current behavior rather than asserting a specific fix
    assert response.status_code == 200

def test_empty_complaint_text_rejected(client, registered_kiosk_operator, registered_patient, facility):
    headers = get_auth_headers(client, "kiosk@test.com", "password123")
    response = client.post("/visits", json={
        "patient_id": 1,
        "facility_id": facility.id,
        "raw_transcript": ""
    }, headers=headers)
    assert response.status_code == 422