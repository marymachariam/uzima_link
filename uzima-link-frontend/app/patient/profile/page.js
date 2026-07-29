"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPatientDashboard, updatePatientProfile } from "@/lib/endpoints";
import styles from "./profile.module.css";
import PatientIdCard from "@/components/PatientIdCard";

function ProfileContent() {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const result = await getPatientDashboard(user.patientId);
        setPatient(result.patient);
        setPhone(result.patient.phone_number || "");
        setNationalId(result.patient.national_id || "");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (user?.patientId) load();
  }, [user]);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      await updatePatientProfile(user.patientId, {
        phone_number: phone,
        national_id: nationalId,
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className={styles.empty}>Loading...</p>;

  return (
    <div>
      <h1 className={styles.title}>My profile</h1>
      <p className={styles.subtitle}>Keep your contact details up to date</p>

      <div className={styles.card}>
        <div className={styles.readonlyRow}>
          <span className={styles.label}>Full name</span>
          <span className={styles.value}>{patient?.full_name}</span>
        </div>
        <div className={styles.readonlyRow}>
          <span className={styles.label}>Date of birth</span>
          <span className={styles.value}>{patient?.date_of_birth}</span>
        </div>
        <div className={styles.readonlyRow}>
          <span className={styles.label}>Smart Card ID</span>
          <span className={styles.value}>{patient?.system_uid}</span>
        </div>

        <form onSubmit={handleSave} className={styles.form}>
          <label className={styles.formLabel}>Phone number</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={styles.input}
          />

          <label className={styles.formLabel}>National ID</label>
          <input
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            className={styles.input}
          />

          {error && <p className={styles.errorText}>{error}</p>}
          {saved && <p className={styles.successText}>Saved</p>}

          <button type="submit" disabled={saving} className={styles.button}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>

        <button
          onClick={() => setShowCard(!showCard)}
          className={styles.button}
          style={{ marginTop: "1rem" }}
        >
          {showCard ? "Hide my card" : "View my digital card"}
        </button>

        {showCard && (
          <div style={{ marginTop: "1.5rem" }}>
            <PatientIdCard patient={patient} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return <ProfileContent />;
}