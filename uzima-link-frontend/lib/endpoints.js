import apiRequest, { API_BASE_URL } from "./api";
import { getAuthToken } from "./auth";

// ---------- Patient Auth ----------

export function registerPatient(data) {
  return apiRequest("/patient/auth/register", { method: "POST", body: data, auth: false });
}

export async function downloadHealthCard(format = "png") {
  const res = await fetch(`${API_BASE_URL}/patient/health-card?format=${format}`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  if (!res.ok) throw new Error("Failed to download health card");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `uzima-health-card.${format}`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function patientLoginStart({ method, value, password }) {
  return apiRequest("/patient/auth/login/start", { method: "POST", body: { method, value, password }, auth: false });
}

export function patientLoginChooseChannel({ national_id, password, channel }) {
  return apiRequest("/patient/auth/login/choose-channel", { method: "POST", body: { national_id, password, channel }, auth: false });
}

export function addDoctorNote(patientId, note) {
  return apiRequest("/doctor/visits/note", { method: "POST", body: { patient_id: patientId, note } });
}

export function patientLoginVerify({ method, value, otp }) {
  return apiRequest("/patient/auth/login/verify", { method: "POST", body: { method, value, otp }, auth: false });
}

export function patientForgotPassword(email) {
  return apiRequest("/patient/auth/forgot-password", { method: "POST", body: { email }, auth: false });
}

export function patientResetPassword(token, newPassword) {
  return apiRequest("/patient/auth/reset-password", { method: "POST", body: { token, new_password: newPassword }, auth: false });
}

// ---------- Doctor Auth ----------

export function registerDoctor(data) {
  return apiRequest("/doctor/auth/register", { method: "POST", body: data, auth: false });
}

export function loginDoctor(email, password) {
  return apiRequest("/doctor/auth/login", { method: "POST", body: { email, password }, auth: false });
}

export function verifyDoctorLogin(email, otp) {
  return apiRequest("/doctor/auth/login/verify", { method: "POST", body: { email, otp }, auth: false });
}

export function doctorForgotPassword(email) {
  return apiRequest("/doctor/auth/forgot-password", { method: "POST", body: { email }, auth: false });
}

export function doctorResetPassword(token, newPassword) {
  return apiRequest("/doctor/auth/reset-password", { method: "POST", body: { token, new_password: newPassword }, auth: false });
}

// ---------- Frontdesk Auth ----------

export function registerFrontdesk(data) {
  return apiRequest("/frontdesk/auth/register", { method: "POST", body: data, auth: false });
}

export function loginFrontdesk(email, password) {
  return apiRequest("/frontdesk/auth/login", { method: "POST", body: { email, password }, auth: false });
}

export function verifyFrontdeskLogin(email, otp) {
  return apiRequest("/frontdesk/auth/login/verify", { method: "POST", body: { email, otp }, auth: false });
}

export function frontdeskForgotPassword(email) {
  return apiRequest("/frontdesk/auth/forgot-password", { method: "POST", body: { email }, auth: false });
}

export function frontdeskResetPassword(token, newPassword) {
  return apiRequest("/frontdesk/auth/reset-password", { method: "POST", body: { token, new_password: newPassword }, auth: false });
}

// ---------- Shared Auth ----------

export function verifyEmail(token) {
  return apiRequest("/auth/verify-email", { method: "POST", body: { token }, auth: false });
}

// ---------- Patient KYC ----------

export function getKycStatus() {
  return apiRequest("/patient/kyc/status", { method: "GET" });
}

export function submitKyc(formData) {
  return apiRequest("/patient/kyc/submit", { method: "POST", body: formData, isFormData: true });
}

// ---------- Patient Profile & Data ----------

export function getPatientProfile() {
  return apiRequest("/patient/profile/me", { method: "GET" });
}

export function updatePatientProfile(data) {
  return apiRequest("/patient/profile/me", { method: "PATCH", body: data });
}

export function uploadPatientPhoto(formData) {
  return apiRequest("/patient/profile/me/photo", { method: "POST", body: formData, isFormData: true });
}

export function logSymptomsText(text) {
  return apiRequest("/patient/symptoms", { method: "POST", body: { text } });
}

export function logSymptomsVoice(formData) {
  return apiRequest("/patient/symptoms/voice", { method: "POST", body: formData, isFormData: true });
}

export function getSymptomHistory() {
  return apiRequest("/patient/symptoms", { method: "GET" });
}

export function createAllergy(data) {
  return apiRequest("/patient/allergies", { method: "POST", body: data });
}

export function getAllergies() {
  return apiRequest("/patient/allergies", { method: "GET" });
}

export function getAllergyRecommendations() {
  return apiRequest("/patient/allergies/recommendations", { method: "GET" });
}

export function checkMedicine(name) {
  return apiRequest(`/patient/medicine/check?name=${encodeURIComponent(name)}`, { method: "GET" });
}

export function getPrescriptions() {
  return apiRequest("/patient/prescriptions", { method: "GET" });
}

export function getConsentRequests() {
  return apiRequest("/patient/consent/requests", { method: "GET" });
}

export function respondToConsentRequest(requestId, approve) {
  return apiRequest(`/patient/consent/requests/${requestId}/respond`, { method: "POST", body: { approve } });
}

// ---------- Doctor Data ----------

export function getDoctorPatientRecord(systemUid) {
  return apiRequest(`/doctor/patients/${systemUid}`, { method: "GET" });
}

export function updateVisitNotes(visitId, doctorNotes) {
  return apiRequest(`/doctor/visits/${visitId}/notes`, { method: "PATCH", body: { doctor_notes: doctorNotes } });
}

export function recordConsultation(patientId, formData) {
  return apiRequest(`/doctor/consultations?patient_id=${patientId}`, { method: "POST", body: formData, isFormData: true });
}

export function prescribeMedication(data) {
  return apiRequest("/doctor/prescriptions", { method: "POST", body: data });
}

export function getDoctorQueue() {
  return apiRequest("/doctor/queue", { method: "GET" });
}

// ---------- Frontdesk Data ----------

export function registerWalkinPatient(data) {
  return apiRequest("/frontdesk/patients/register-walkin", { method: "POST", body: data });
}

export function searchPatients(query) {
  return apiRequest(`/frontdesk/patients/search?query=${encodeURIComponent(query)}`, { method: "GET" });
}

export function checkInPatient(patientId) {
  return apiRequest("/frontdesk/checkin", { method: "POST", body: { patient_id: patientId } });
}

export function getFrontdeskQueue() {
  return apiRequest("/frontdesk/queue", { method: "GET" });
}

// ---------- Admin Data & Operations ----------

export function getPendingPatientKyc() {
  return apiRequest("/admin/kyc/patients/pending", { method: "GET" });
}

export function decidePatientKyc(patientId, approve, note = "") {
  return apiRequest(`/admin/kyc/patients/${patientId}/decision`, {
    method: "POST",
    body: { approve, note },
  });
}

export function getPendingDoctorKyc() {
  return apiRequest("/admin/kyc/doctors/pending", { method: "GET" });
}

export function decideDoctorKyc(userId, approve, note = "") {
  return apiRequest(`/admin/kyc/doctors/${userId}/decision`, {
    method: "POST",
    body: { approve, note },
  });
}

export function generateFacilityInviteCode(facilityId, data = {}) {
  return apiRequest(`/admin/facilities/${facilityId}/generate-invite-code`, {
    method: "POST",
    body: data,
  });
}

export function resendVerificationEmail(email) {
  return apiRequest("/auth/resend-verification", { method: "POST", body: { email }, auth: false });
}

export function createManualFacility(data) {
  return apiRequest("/admin/facilities", { method: "POST", data });
}

export function inviteStaff(data) {
  return apiRequest("/admin/invite-staff", { method: "POST", body: data });
}

export function getDoctorKycStatus() {
  return apiRequest("/doctor/kyc/status", { method: "GET" });
}

export function submitDoctorKyc(formData) {
  return apiRequest("/doctor/kyc/submit", { method: "POST", body: formData, isFormData: true });
}

export function checkMedicineByImage(formData) {
  return apiRequest("/patient/medicine/check-by-image", { method: "POST", body: formData, isFormData: true });
}

export function checkMedicineByVoice(formData) {
  return apiRequest("/patient/medicine/check-by-voice", { method: "POST", body: formData, isFormData: true });
}

export function getDoctorProfile() {
  return apiRequest("/doctor/profile/me", { method: "GET" });
}

export function updateDoctorProfile(data) {
  return apiRequest("/doctor/profile/me", { method: "PATCH", body: data });
}

export function uploadDoctorPhoto(formData) {
  return apiRequest("/doctor/profile/me/photo", { method: "POST", body: formData, isFormData: true });
}

export function startQueueConsultation(entryId) {
  return apiRequest(`/doctor/queue/${entryId}/start`, { method: "PATCH" });
}

export function completeQueueConsultation(entryId) {
  return apiRequest(`/doctor/queue/${entryId}/complete`, { method: "PATCH" });
}

export function requestPatientConsent(systemUid) {
  return apiRequest(`/doctor/patients/${systemUid}/request-consent`, { method: "POST" });
}

// ---------- Patient Consent Management ----------

export function getConsents() {
  return apiRequest("/patient/consent", { method: "GET" });
}

export function revokeConsent(consentId) {
  return apiRequest(`/patient/consent/${consentId}`, { method: "DELETE" });
}

export function getFrontdeskProfile() {
  return apiRequest("/frontdesk/profile/me", { method: "GET" });
}

export function updateFrontdeskProfile(data) {
  return apiRequest("/frontdesk/profile/me", { method: "PATCH", body: data });
}

export function uploadFrontdeskPhoto(formData) {
  return apiRequest("/frontdesk/profile/me/photo", { method: "POST", body: formData, isFormData: true });
}