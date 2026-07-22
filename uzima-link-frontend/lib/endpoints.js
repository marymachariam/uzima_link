import apiRequest from "./api";

// ---------- Auth ----------

export function registerPatient(data) {
  return apiRequest("/auth/register/patient", { method: "POST", body: data, auth: false });
}

export function registerStaff(data) {
  return apiRequest("/auth/register/staff", { method: "POST", body: data, auth: false });
}

export function login(email, password) {
  return apiRequest("/auth/login", { method: "POST", body: { email, password }, auth: false });
}

// ---------- Patients ----------

export function createPatient(data) {
  return apiRequest("/patients", { method: "POST", body: data, auth: false });
}

export function lookupPatient({ phone_number, national_id, system_uid }) {
  const params = new URLSearchParams();
  if (phone_number) params.set("phone_number", phone_number);
  if (national_id) params.set("national_id", national_id);
  if (system_uid) params.set("system_uid", system_uid);

  return apiRequest(`/patients/lookup?${params.toString()}`, { method: "GET" });
}

export function getPatientDashboard(patientId) {
  return apiRequest(`/patients/${patientId}/dashboard`, { method: "GET" });
}

// ---------- Visits ----------

export function createVisit(data) {
  return apiRequest("/visits", { method: "POST", body: data });
}

export function createVisitFromAudio(formData) {
  return apiRequest("/visits/audio", { method: "POST", body: formData, isFormData: true });
}

export function updateDoctorNotes(visitId, doctorNotes) {
  return apiRequest(`/visits/${visitId}/notes`, {
    method: "PATCH",
    body: { doctor_notes: doctorNotes },
  });
}

// ---------- Allergies ----------

export function createAllergy(data) {
  return apiRequest("/allergies", { method: "POST", body: data });
}
export function getRecentPatients(facilityId, limit = 20) {
  return apiRequest(`/facilities/${facilityId}/recent-patients?limit=${limit}`, { method: "GET" });
}

export function getFacilityNotes(facilityId) {
  return apiRequest(`/facilities/${facilityId}/notes`, { method: "GET" });
}
export function updatePatientProfile(patientId, data) {
  return apiRequest(`/patients/${patientId}`, { method: "PATCH", body: data });
}

export function getRecentRegistrations(limit = 5) {
  return apiRequest(`/patients/notifications/recent?limit=${limit}`, { method: "GET" });
}

export function forgotPassword(email) {
  return apiRequest("/auth/forgot-password", { method: "POST", body: { email }, auth: false });
}

export function resetPassword(token, newPassword) {
  return apiRequest("/auth/reset-password", { method: "POST", body: { token, new_password: newPassword }, auth: false });
}