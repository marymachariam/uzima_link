"use client";
import { useState, useEffect } from "react";
import {
  getPendingPatientKyc,
  decidePatientKyc,
  getPendingDoctorKyc,
  decideDoctorKyc,
  createManualFacility,
  inviteStaff
} from "../../lib/endpoints";
import styles from "./admin.module.css";

export default function AdminPage() {
  const [apiKey, setApiKey] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState("patients");

  const [pendingPatients, setPendingPatients] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [facilityForm, setFacilityForm] = useState({ name: "", kmhfr_code: "", facility_type: "", county: "", sub_county: "" });
  const [staffForm, setStaffForm] = useState({ facility_kmhfr_code: "", email: "", full_name: "", role: "doctor" });

  useEffect(() => {
    const savedKey = localStorage.getItem("uzima_admin_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsAuthorized(true);
      fetchAllData();
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    localStorage.setItem("uzima_admin_key", apiKey);
    setIsAuthorized(true);
    fetchAllData();
  };

  const handleLogout = () => {
    localStorage.removeItem("uzima_admin_key");
    setApiKey("");
    setIsAuthorized(false);
    setPendingPatients([]);
    setPendingDoctors([]);
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const [patients, doctors] = await Promise.all([
        getPendingPatientKyc().catch(() => []),
        getPendingDoctorKyc().catch(() => [])
      ]);
      setPendingPatients(patients || []);
      setPendingDoctors(doctors || []);
    } catch (err) {
      setError(err.message || "Failed to fetch admin queues.");
    } finally {
      setLoading(false);
    }
  };

  const handlePatientDecision = async (patientId, approve) => {
    setActionLoading(patientId);
    try {
      await decidePatientKyc(patientId, approve, "Reviewed via Uzima Admin Dashboard");
      await fetchAllData();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDoctorDecision = async (userId, approve) => {
    setActionLoading(userId);
    try {
      await decideDoctorKyc(userId, approve, "Reviewed via Uzima Admin Dashboard");
      await fetchAllData();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateFacility = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await createManualFacility(facilityForm);
      setSuccessMsg("Facility successfully registered!");
      setFacilityForm({ name: "", kmhfr_code: "", facility_type: "", county: "", sub_county: "" });
    } catch (err) {
      setError(err.message || "Failed to create facility.");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteStaffMember = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await inviteStaff(staffForm);
      setSuccessMsg(`Invite successfully sent to ${staffForm.email}!`);
      setStaffForm({ facility_kmhfr_code: "", email: "", full_name: "", role: "doctor" });
    } catch (err) {
      setError(err.message || "Failed to send staff invitation.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.badge}>Secure Admin Portal</div>
          <h1 className={styles.loginTitle}>System Access</h1>
          <p className={styles.loginSubtitle}>Enter your administrative API key to continue.</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter Admin API Key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className={styles.input}
            />
            <button type="submit" className={styles.primaryButton}>
              Authenticate Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.navTitle}>Uzima Link Administration</h1>
          <p className={styles.navSubtitle}>System-level oversight, facility onboarding, and KYC verification</p>
        </div>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Lock Session
        </button>
      </header>

      <main className={styles.mainContent}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "24px", borderBottom: "1px solid #e5e7eb", paddingBottom: "12px" }}>
          <button
            onClick={() => setActiveTab("patients")}
            style={{ padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", background: activeTab === "patients" ? "#059669" : "#e5e7eb", color: activeTab === "patients" ? "#fff" : "#374151", fontWeight: "600" }}
          >
            Pending Patients ({pendingPatients.length})
          </button>
          <button
            onClick={() => setActiveTab("doctors")}
            style={{ padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", background: activeTab === "doctors" ? "#059669" : "#e5e7eb", color: activeTab === "doctors" ? "#fff" : "#374151", fontWeight: "600" }}
          >
            Pending Doctors ({pendingDoctors.length})
          </button>
          <button
            onClick={() => setActiveTab("facilities")}
            style={{ padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", background: activeTab === "facilities" ? "#059669" : "#e5e7eb", color: activeTab === "facilities" ? "#fff" : "#374151", fontWeight: "600" }}
          >
            Register Facility
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            style={{ padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", background: activeTab === "staff" ? "#059669" : "#e5e7eb", color: activeTab === "staff" ? "#fff" : "#374151", fontWeight: "600" }}
          >
            Invite Staff
          </button>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}
        {successMsg && <div style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>{successMsg}</div>}

        {activeTab === "patients" && (
          <div className={styles.tableCard}>
            <div className={styles.tableHeaderRow}>
              <h3 className={styles.tableTitle}>Pending Patient Identity Verification</h3>
              <button onClick={fetchAllData} className={styles.secondaryButton}>Refresh</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.trHead}>
                    <th className={styles.th}>System UID</th>
                    <th className={styles.th}>Full Name</th>
                    <th className={styles.th}>National ID</th>
                    <th className={styles.th}>Phone</th>
                    <th className={styles.th}>Photos</th>
                    <th className={styles.thRight}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPatients.map((p) => (
                    <tr key={p.id} className={styles.trBody}>
                      <td className={styles.td}><code className={styles.code}>{p.system_uid}</code></td>
                      <td className={styles.td} style={{ fontWeight: "600" }}>{p.full_name}</td>
                      <td className={styles.td}>{p.national_id || "N/A"}</td>
                      <td className={styles.td}>{p.phone_number || "N/A"}</td>
                      <td className={styles.td}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {p.kyc_selfie_url && (
                            <img
                              src={p.kyc_selfie_url}
                              alt="Selfie"
                              title="Selfie — click to enlarge"
                              onClick={() => setPreviewImage(p.kyc_selfie_url)}
                              style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, cursor: "pointer", border: "1px solid #e5e7eb" }}
                            />
                          )}
                          {p.kyc_id_document_url && (
                            <img
                              src={p.kyc_id_document_url}
                              alt="ID document"
                              title="ID document — click to enlarge"
                              onClick={() => setPreviewImage(p.kyc_id_document_url)}
                              style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, cursor: "pointer", border: "1px solid #e5e7eb" }}
                            />
                          )}
                          {!p.kyc_selfie_url && !p.kyc_id_document_url && <span style={{ color: "#9ca3af", fontSize: 12 }}>No photos</span>}
                        </div>
                      </td>
                      <td className={styles.tdRight}>
                        <button onClick={() => handlePatientDecision(p.id, true)} disabled={actionLoading === p.id} className={styles.approveButton}>Approve</button>
                        <button onClick={() => handlePatientDecision(p.id, false)} disabled={actionLoading === p.id} className={styles.rejectButton}>Reject</button>
                      </td>
                    </tr>
                  ))}
                  {pendingPatients.length === 0 && (
                    <tr><td colSpan="6" className={styles.emptyState}>No pending patient KYC requests found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "doctors" && (
          <div className={styles.tableCard}>
            <div className={styles.tableHeaderRow}>
              <h3 className={styles.tableTitle}>Pending Doctor Identity Verification</h3>
              <button onClick={fetchAllData} className={styles.secondaryButton}>Refresh</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.trHead}>
                    <th className={styles.th}>User ID</th>
                    <th className={styles.th}>Full Name</th>
                    <th className={styles.th}>Email</th>
                    <th className={styles.th}>Photos</th>
                    <th className={styles.thRight}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDoctors.map((doc) => (
                    <tr key={doc.id} className={styles.trBody}>
                      <td className={styles.td}><code className={styles.code}>{doc.id}</code></td>
                      <td className={styles.td} style={{ fontWeight: "600" }}>{doc.full_name}</td>
                      <td className={styles.td}>{doc.email}</td>
                      <td className={styles.td}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {doc.kyc_selfie_url && (
                            <img
                              src={doc.kyc_selfie_url}
                              alt="Selfie"
                              title="Selfie — click to enlarge"
                              onClick={() => setPreviewImage(doc.kyc_selfie_url)}
                              style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, cursor: "pointer", border: "1px solid #e5e7eb" }}
                            />
                          )}
                          {doc.kyc_id_document_url && (
                            <img
                              src={doc.kyc_id_document_url}
                              alt="ID document"
                              title="ID document — click to enlarge"
                              onClick={() => setPreviewImage(doc.kyc_id_document_url)}
                              style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, cursor: "pointer", border: "1px solid #e5e7eb" }}
                            />
                          )}
                          {!doc.kyc_selfie_url && !doc.kyc_id_document_url && <span style={{ color: "#9ca3af", fontSize: 12 }}>No photos</span>}
                        </div>
                      </td>
                      <td className={styles.tdRight}>
                        <button onClick={() => handleDoctorDecision(doc.id, true)} disabled={actionLoading === doc.id} className={styles.approveButton}>Approve</button>
                        <button onClick={() => handleDoctorDecision(doc.id, false)} disabled={actionLoading === doc.id} className={styles.rejectButton}>Reject</button>
                      </td>
                    </tr>
                  ))}
                  {pendingDoctors.length === 0 && (
                    <tr><td colSpan="5" className={styles.emptyState}>No pending doctor KYC requests found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "facilities" && (
          <div className={styles.tableCard} style={{ padding: "30px", maxWidth: "600px" }}>
            <h3 className={styles.tableTitle} style={{ marginBottom: "20px" }}>Manually Register New Facility</h3>
            <form onSubmit={handleCreateFacility}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Facility Name</label>
                <input type="text" placeholder="e.g. Kenyatta National Hospital" value={facilityForm.name} onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })} className={styles.input} required />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>KMHFR Code</label>
                <input type="text" placeholder="e.g. 12345" value={facilityForm.kmhfr_code} onChange={(e) => setFacilityForm({ ...facilityForm, kmhfr_code: e.target.value })} className={styles.input} required />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Facility Type</label>
                <input type="text" placeholder="e.g. Level 5 Hospital" value={facilityForm.facility_type} onChange={(e) => setFacilityForm({ ...facilityForm, facility_type: e.target.value })} className={styles.input} required />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>County</label>
                <input type="text" placeholder="e.g. Nairobi" value={facilityForm.county} onChange={(e) => setFacilityForm({ ...facilityForm, county: e.target.value })} className={styles.input} required />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Sub-County</label>
                <input type="text" placeholder="e.g. Westlands" value={facilityForm.sub_county} onChange={(e) => setFacilityForm({ ...facilityForm, sub_county: e.target.value })} className={styles.input} required />
              </div>
              <button type="submit" disabled={loading} className={styles.primaryButton}>{loading ? "Saving..." : "Register Facility"}</button>
            </form>
          </div>
        )}

        {activeTab === "staff" && (
          <div className={styles.tableCard} style={{ padding: "30px", maxWidth: "600px" }}>
            <h3 className={styles.tableTitle} style={{ marginBottom: "20px" }}>Invite Staff Member</h3>
            <form onSubmit={handleInviteStaffMember}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Facility KMHFR Code</label>
                <input type="text" placeholder="Enter facility KMHFR code" value={staffForm.facility_kmhfr_code} onChange={(e) => setStaffForm({ ...staffForm, facility_kmhfr_code: e.target.value })} className={styles.input} required />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Staff Full Name</label>
                <input type="text" placeholder="e.g. Dr. Jane Doe" value={staffForm.full_name} onChange={(e) => setStaffForm({ ...staffForm, full_name: e.target.value })} className={styles.input} required />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Staff Email</label>
                <input type="email" placeholder="e.g. jane@hospital.com" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} className={styles.input} required />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Role</label>
                <select value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })} className={styles.input}>
                  <option value="doctor">Doctor</option>
                  <option value="kiosk_operator">Frontdesk (Kiosk Operator)</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className={styles.primaryButton}>{loading ? "Sending Invite..." : "Send Staff Invitation"}</button>
            </form>
          </div>
        )}
      </main>

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, cursor: "zoom-out", padding: "2rem",
          }}
        >
          <img src={previewImage} alt="KYC document preview" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}