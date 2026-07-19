"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { getPatientDashboard, updateDoctorNotes } from "@/lib/endpoints";
import styles from "./patient.module.css";

function DashboardContent() {
  const { patientId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [transcriptView, setTranscriptView] = useState("english");

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const result = await getPatientDashboard(patientId);
      setData(result);
      setNotes(result.current_visit?.doctor_notes || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [patientId]);

  async function handleSaveNotes() {
    if (!data?.current_visit) return;
    setSavingNotes(true);
    try {
      await updateDoctorNotes(data.current_visit.id, notes);
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading)
    return <div className={styles.loading}>Loading dashboard...</div>;
  if (error) return <div className={styles.errorFull}>{error}</div>;
  if (!data) return null;

  const { patient, allergy_alert, allergies, current_visit, visit_history } =
    data;

  return (
    <div className={styles.container}>
      {allergy_alert && (
        <div className={styles.allergyBanner}>
          ⚠ ALLERGY ALERT —{" "}
          {allergies.map((a) => `${a.allergen} (${a.severity})`).join(", ")}
        </div>
      )}

      <div className={styles.card}>
        <h1 className={styles.patientName}>{patient.full_name}</h1>
        <p className={styles.patientMeta}>
          {patient.gender} · DOB {patient.date_of_birth} · {patient.system_uid}
        </p>
      </div>

      {current_visit && (
        <div className={styles.card}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Current Presentation</h2>
            <span
              className={
                current_visit.source === "self_reported"
                  ? styles.badgeSelf
                  : styles.badgeKiosk
              }
            >
              {current_visit.source === "self_reported"
                ? "Self-reported"
                : "In-person"}
            </span>
          </div>

          <div className={styles.entityGrid}>
            <EntityColumn
              title="Symptoms"
              entities={current_visit.clinical_entities}
              type="symptom"
            />
            <EntityColumn
              title="Conditions"
              entities={current_visit.clinical_entities}
              type="condition"
            />
            <EntityColumn
              title="Medications"
              entities={current_visit.clinical_entities}
              type="medication"
            />
          </div>

          <div className={styles.transcriptToggle}>
            {[
              ["english", "English"],
              ["swahili", "Swahili"],
              ["original", "Original"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTranscriptView(key)}
                className={
                  transcriptView === key
                    ? styles.transcriptTabActive
                    : styles.transcriptTab
                }
              >
                {label}
              </button>
            ))}
          </div>
          <div className={styles.transcripts}>
            {transcriptView === "english" &&
              (current_visit.english_transcript ||
                "No English translation available.")}
            {transcriptView === "swahili" &&
              (current_visit.swahili_transcript ||
                "No Swahili translation available.")}
            {transcriptView === "original" && current_visit.raw_transcript}
          </div>

          <label className={styles.notesLabel}>Doctors notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={styles.notesTextarea}
          />
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className={styles.saveButton}
          >
            {savingNotes ? "Saving..." : "Save notes"}
          </button>
        </div>
      )}

      {visit_history.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Visit History</h2>
          <div className={styles.historyList}>
            {visit_history.map((v) => (
              <div key={v.id} className={styles.historyItem}>
                <p className={styles.historyDate}>
                  {new Date(v.visit_date).toLocaleDateString()}
                  {v.facility_id ? ` · Facility ${v.facility_id}` : ""}
                  {" · "}
                  <span
                    className={
                      v.source === "self_reported"
                        ? styles.badgeSelfInline
                        : styles.badgeKioskInline
                    }
                  >
                    {v.source === "self_reported"
                      ? "Self-reported"
                      : "In-person"}
                  </span>
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

function EntityColumn({ title, entities, type }) {
  const filtered = entities.filter((e) => e.entity_type === type);
  return (
    <div>
      <p className={styles.entityLabel}>{title}</p>
      {filtered.length === 0 ? (
        <p className={styles.entityEmpty}>None</p>
      ) : (
        <ul className={styles.entityList}>
          {filtered.map((e) => (
            <li key={e.id}>{e.description}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DoctorPatientPage() {
  return <DashboardContent />;
}
