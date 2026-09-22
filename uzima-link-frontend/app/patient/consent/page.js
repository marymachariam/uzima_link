"use client";

import { useEffect, useState } from "react";
import { 
  getConsents, 
  getConsentRequests, 
  respondToConsentRequest, 
  revokeConsent 
} from "@/lib/endpoints";
import styles from "./page.module.css";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Building2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles,
  Lock,
  RefreshCw
} from "lucide-react";

export default function ConsentPage() {
  const [activeTab, setActiveTab] = useState("consents"); // "consents" | "requests"
  const [consents, setConsents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [consentsData, requestsData] = await Promise.all([
        getConsents().catch(() => []),
        getConsentRequests().catch(() => [])
      ]);
      setConsents(Array.isArray(consentsData) ? consentsData : consentsData?.consents || []);
      setRequests(Array.isArray(requestsData) ? requestsData : requestsData?.requests || []);
    } catch (err) {
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  async function handleRevoke(consentId) {
    if (!confirm("Are you sure you want to revoke data access for this facility?")) return;
    setError("");
    setSuccessMsg("");
    setActionLoading(consentId);
    try {
      await revokeConsent(consentId);
      setSuccessMsg("Consent successfully revoked.");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to revoke consent.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRespond(requestId, approve) {
    setError("");
    setSuccessMsg("");
    setActionLoading(requestId);
    try {
      await respondToConsentRequest(requestId, { status: approve ? "approved" : "rejected" });
      setSuccessMsg(`Request successfully ${approve ? "approved" : "rejected"}.`);
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to respond to request.");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerBadge}>
          <Sparkles size={14} /> Privacy & Data Security
        </div>
        <h1 className={styles.title}>Consent & Facility Access</h1>
        <p className={styles.subtitle}>
          Control which hospitals and healthcare facilities have permission to view your clinical records.
        </p>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className={styles.successBox}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className={styles.tabContainer}>
        <button 
          onClick={() => setActiveTab("consents")} 
          className={`${styles.tabButton} ${activeTab === "consents" ? styles.activeTab : ""}`}
        >
          <ShieldCheck size={16} />
          <span>Active Consents ({consents.length})</span>
        </button>
        <button 
          onClick={() => setActiveTab("requests")} 
          className={`${styles.tabButton} ${activeTab === "requests" ? styles.activeTab : ""}`}
        >
          <Clock size={16} />
          <span>Pending Requests ({requests.length})</span>
          {requests.length > 0 && <span className={styles.badgeCount}>{requests.length}</span>}
        </button>
        <button onClick={loadData} className={styles.refreshButton} title="Refresh lists">
          <RefreshCw size={15} className={loading ? styles.spinning : ""} />
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <span>Loading security records...</span>
        </div>
      ) : activeTab === "consents" ? (
        <div className={styles.section}>
          {consents.length === 0 ? (
            <div className={styles.emptyBox}>
              <ShieldAlert size={40} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>No Active Facility Consents</h3>
              <p className={styles.emptyText}>
                You have not granted active data access to any external hospitals or clinics. Your records are fully private.
              </p>
            </div>
          ) : (
            <div className={styles.grid}>
              {consents.map((item) => (
                <div key={item.id || item.consent_id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.facilityInfo}>
                      <div className={styles.facilityIcon}>
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h3 className={styles.facilityName}>
                          {item.facility_name || item.hospital_name || item.name || "Authorized Facility"}
                        </h3>
                        <p className={styles.grantDate}>
                          Granted on: {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Recent"}
                        </p>
                      </div>
                    </div>
                    <span className={styles.activeTag}>
                      <ShieldCheck size={13} /> Active Access
                    </span>
                  </div>

                  <div className={styles.cardBody}>
                    <p className={styles.scopeText}>
                      <strong>Authorized Data:</strong> {item.scope || item.permissions || "Full Medical Records & Prescriptions"}
                    </p>
                  </div>

                  <div className={styles.cardFooter}>
                    <span className={styles.securityNote}>
                      <Lock size={12} /> Encrypted transfer
                    </span>
                    <button 
                      onClick={() => handleRevoke(item.id || item.consent_id)}
                      disabled={actionLoading === (item.id || item.consent_id)}
                      className={styles.revokeButton}
                    >
                      {actionLoading === (item.id || item.consent_id) ? "Revoking..." : "Revoke Access"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.section}>
          {requests.length === 0 ? (
            <div className={styles.emptyBox}>
              <CheckCircle2 size={40} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>No Pending Requests</h3>
              <p className={styles.emptyText}>
                There are no pending facility permission requests waiting for your approval.
              </p>
            </div>
          ) : (
            <div className={styles.grid}>
              {requests.map((req) => (
                <div key={req.id || req.request_id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.facilityInfo}>
                      <div className={styles.requestIcon}>
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h3 className={styles.facilityName}>
                          {req.facility_name || req.hospital_name || req.requester_name || "Medical Facility"}
                        </h3>
                        <p className={styles.grantDate}>
                          Requested: {req.created_at ? new Date(req.created_at).toLocaleDateString() : "Today"}
                        </p>
                      </div>
                    </div>
                    <span className={styles.pendingTag}>
                      <Clock size={13} /> Pending Review
                    </span>
                  </div>

                  <div className={styles.cardBody}>
                    <p className={styles.scopeText}>
                      <strong>Purpose / Scope:</strong> {req.purpose || req.scope || "Emergency medical record review and triage."}
                    </p>
                  </div>

                  <div className={styles.cardFooterActions}>
                    <button 
                      onClick={() => handleRespond(req.id || req.request_id, false)}
                      disabled={actionLoading === (req.id || req.request_id)}
                      className={styles.rejectButton}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                    <button 
                      onClick={() => handleRespond(req.id || req.request_id, true)}
                      disabled={actionLoading === (req.id || req.request_id)}
                      className={styles.approveButton}
                    >
                      <CheckCircle2 size={16} /> {actionLoading === (req.id || req.request_id) ? "Processing..." : "Approve Access"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}