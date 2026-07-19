"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { getPatientDashboard } from "@/lib/endpoints";
import styles from "./patient.module.css";

function PatientDashboardContent() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.patientId) {
        setError("No patient record linked to this account.");
        setLoading(false);
        return;
      }
      try {
        const result = await getPatientDashboard(user.patientId);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading)
    return <div className={styles.loading}>Loading your records...</div>;
  if (error) return <div className={styles.errorFull}>{error}</div>;
  if (!data) return null;

  const { patient, allergy_alert, allergies, current_visit, visit_history } =
    data;

  return (
    <div className={styles.container}>
      <div className={styles.welcomeCard}>
        <h1 className={styles.welcomeTitle}>Welcome, {patient.full_name}</h1>
        <p className={styles.welcomeMeta}>
          Your medical record · {patient.system_uid}
        </p>
      </div>
      <Link href="/patient/report" className={styles.reportButton}>
        How are you feeling today?
      </Link>

      {allergy_alert && (
        <div className={styles.allergyBanner}>
          Your allergy records:{" "}
          {allergies.map((a) => `${a.allergen} (${a.severity})`).join(", ")}
        </div>
      )}

      {current_visit && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Most Recent Visit</h2>
          <p className={styles.visitDate}>
            {new Date(current_visit.visit_date).toLocaleDateString()}
          </p>
          <p className={styles.visitText}>
            {current_visit.english_transcript || current_visit.raw_transcript}
          </p>
          {current_visit.doctor_notes && (
            <div className={styles.notesBlock}>
              <p className={styles.notesLabel}>Doctor's notes</p>
              <p className={styles.notesText}>{current_visit.doctor_notes}</p>
            </div>
          )}
        </div>
      )}

      {visit_history.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Past Visits</h2>
          <div className={styles.historyList}>
            {visit_history.map((v) => (
              <div key={v.id} className={styles.historyItem}>
                <p className={styles.historyDate}>
                  {new Date(v.visit_date).toLocaleDateString()}
                </p>
                <p className={styles.historyText}>
                  {v.english_transcript || v.raw_transcript}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PatientPage() {
  return (
      <PatientDashboardContent />
  );
}
