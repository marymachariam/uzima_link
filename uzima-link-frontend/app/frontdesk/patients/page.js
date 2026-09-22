"use client";

import { useState } from "react";
import { searchPatients, registerWalkinPatient, checkInPatient } from "@/lib/endpoints";
import styles from "./page.module.css";

const ID_TYPES = [
  { value: "none", label: "No identification document yet" },
  { value: "national_id", label: "National ID" },
  { value: "birth_certificate", label: "Birth Certificate" },
  { value: "alien_id", label: "Alien ID" },
  { value: "passport", label: "Passport" },
];

export default function KioskPatientsPage() {
  const [mode, setMode] = useState("search");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const [regForm, setRegForm] = useState({
    full_name: "", date_of_birth: "", gender: "", phone_number: "",
    id_type: "none", national_id: "", guardian_name: "", guardian_phone: "",
  });
  const [registering, setRegistering] = useState(false);

  const [checkingIn, setCheckingIn] = useState(null);
  const [checkedInMsg, setCheckedInMsg] = useState("");
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await searchPatients(query);
      setResults(res);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setRegistering(true);
    try {
      const payload = {
        ...regForm,
        national_id: regForm.national_id || undefined,
        guardian_name: regForm.guardian_name || undefined,
        guardian_phone: regForm.guardian_phone || undefined,
      };
      const patient = await registerWalkinPatient(payload);
      await handleCheckIn(patient);
    } catch (err) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  }

  async function handleCheckIn(patient) {
    setCheckingIn(patient.id);
    setCheckedInMsg("");
    setError("");
    try {
      await checkInPatient(patient.id);
      setCheckedInMsg(`Successfully checked in ${patient.full_name}. Added to facility queue & consent request dispatched.`);
      setRegForm({ full_name: "", date_of_birth: "", gender: "", phone_number: "", id_type: "none", national_id: "", guardian_name: "", guardian_phone: "" });
      setResults([]);
      setQuery("");
      setSearched(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingIn(null);
    }
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerSection}>
        <div>
          <h1 className={styles.title}>Patient Management</h1>
          <p className={styles.subtitle}>Find existing patient records or register new walk-ins for immediate check-in.</p>
        </div>
        <div className={styles.tabs}>
          <button 
            onClick={() => { setMode("search"); setError(""); }} 
            className={mode === "search" ? styles.tabActive : styles.tab}
          >
            🔍 Find Existing Patient
          </button>
          <button 
            onClick={() => { setMode("register"); setError(""); }} 
            className={mode === "register" ? styles.tabActive : styles.tab}
          >
            ➕ Register Walk-in
          </button>
        </div>
      </div>

      {checkedInMsg && (
        <div className={styles.successBox}>
          <span className={styles.alertIcon}>✅</span>
          <div>
            <p className={styles.alertTitle}>Check-in Successful</p>
            <p className={styles.alertDesc}>{checkedInMsg}</p>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.errorBox}>
          <span className={styles.alertIcon}>⚠️</span>
          <div>
            <p className={styles.alertTitle}>Action Required</p>
            <p className={styles.alertDesc}>{error}</p>
          </div>
        </div>
      )}

      {mode === "search" ? (
        <div className={styles.contentCard}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.inputWrapper}>
              <span className={styles.searchIcon}>🔎</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by full name, phone number, or national ID..."
                className={styles.searchInput}
              />
            </div>
            <button type="submit" disabled={searching} className={styles.submitButton}>
              {searching ? "Searching..." : "Search Records"}
            </button>
          </form>

          {searched && results.length === 0 && (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No matching patients found</p>
              <p className={styles.emptyDesc}>We couldn't find anyone matching your query. Switch to the Walk-in tab to register them.</p>
            </div>
          )}

          <div className={styles.list}>
            {results.map((p) => (
              <div key={p.id} className={styles.card}>
                <div className={styles.cardInfo}>
                  <div className={styles.avatarMini}>{p.full_name?.charAt(0) || "P"}</div>
                  <div>
                    <p className={styles.cardName}>{p.full_name}</p>
                    <p className={styles.cardMeta}>
                      <span className={styles.badgeUid}>{p.system_uid}</span>
                      <span>📞 {p.phone_number || "No phone on record"}</span>
                      {p.national_id && <span>🆔 {p.national_id}</span>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCheckIn(p)}
                  disabled={checkingIn === p.id}
                  className={styles.checkinButton}
                >
                  {checkingIn === p.id ? "Processing..." : "Check In →"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.contentCardWide}>
          <div className={styles.formHeader}>
            <h2>Walk-in Patient Registration</h2>
            <p>Enter details below to instantly create a profile and check them into the queue.</p>
          </div>

          <form onSubmit={handleRegister} className={styles.registerForm}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Full Legal Name *</label>
              <input
                placeholder="e.g. Mary Wanjiru"
                value={regForm.full_name}
                onChange={(e) => setRegForm((f) => ({ ...f, full_name: e.target.value }))}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.row2}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Date of Birth *</label>
                <input
                  type="date"
                  value={regForm.date_of_birth}
                  onChange={(e) => setRegForm((f) => ({ ...f, date_of_birth: e.target.value }))}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Gender *</label>
                <select
                  value={regForm.gender}
                  onChange={(e) => setRegForm((f) => ({ ...f, gender: e.target.value }))}
                  className={styles.input}
                  required
                >
                  <option value="" disabled>Select gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Phone Number</label>
              <input
                placeholder="+254700000000"
                value={regForm.phone_number}
                onChange={(e) => setRegForm((f) => ({ ...f, phone_number: e.target.value }))}
                className={styles.input}
              />
            </div>

            <div className={styles.row2}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Identification Type</label>
                <select
                  value={regForm.id_type}
                  onChange={(e) => setRegForm((f) => ({ ...f, id_type: e.target.value }))}
                  className={styles.input}
                >
                  {ID_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {regForm.id_type !== "none" && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Document Number *</label>
                  <input
                    placeholder="Enter ID number"
                    value={regForm.national_id}
                    onChange={(e) => setRegForm((f) => ({ ...f, national_id: e.target.value }))}
                    className={styles.input}
                    required
                  />
                </div>
              )}
            </div>

            <div className={styles.sectionDivider} />
            <p className={styles.sectionSubHeading}>Guardian Details (Optional for minors)</p>

            <div className={styles.row2}>
              <input
                placeholder="Guardian full name"
                value={regForm.guardian_name}
                onChange={(e) => setRegForm((f) => ({ ...f, guardian_name: e.target.value }))}
                className={styles.input}
              />
              <input
                placeholder="Guardian phone number"
                value={regForm.guardian_phone}
                onChange={(e) => setRegForm((f) => ({ ...f, guardian_phone: e.target.value }))}
                className={styles.input}
              />
            </div>

            <button type="submit" disabled={registering} className={styles.submitButtonLarge}>
              {registering ? "Registering & Checking In..." : "Register & Check In Patient"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}