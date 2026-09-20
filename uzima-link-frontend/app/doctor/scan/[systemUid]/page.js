"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getDoctorPatientRecord,
  updateVisitNotes,
  recordConsultation,
  prescribeMedication,
} from "@/lib/endpoints";
import styles from "./page.module.css";

export default function PatientRecordPage() {
  const { systemUid } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [notesDraft, setNotesDraft] = useState({});
  const [savingNotes, setSavingNotes] = useState(null);

  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingLoading, setRecordingLoading] = useState(false);

  const [errorStatus, setErrorStatus] = useState(null);
  const [requestingConsent, setRequestingConsent] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const [rxForm, setRxForm] = useState({
    medication_name: "",
    dosage_instructions: "",
    notes: "",
  });
  const [rxSubmitting, setRxSubmitting] = useState(false);
  const [rxSuccess, setRxSuccess] = useState("");

  useEffect(() => {
    load();
  }, [systemUid]);

  function load() {
    setLoading(true);
    setError("");
    getDoctorPatientRecord(systemUid)
      .then((res) => {
        setData(res);
        const drafts = {};
        res.visits.forEach((v) => (drafts[v.id] = v.doctor_notes || ""));
        setNotesDraft(drafts);
      })
      .catch((err) => {
        setError(err.message);
        setErrorStatus(err.status);
      })
      .finally(() => setLoading(false));
  }

  async function handleRequestConsent() {
    setRequestingConsent(true);
    try {
      await requestPatientConsent(systemUid);
      setRequestSent(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setRequestingConsent(false);
    }
  }

  async function handleSaveNotes(visitId) {
    setSavingNotes(visitId);
    try {
      await updateVisitNotes(visitId, notesDraft[visitId]);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingNotes(null);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", blob, "consultation.webm");
        setRecordingLoading(true);
        try {
          await recordConsultation(data.patient.id, formData);
          load();
        } catch (err) {
          alert(err.message);
        } finally {
          setRecordingLoading(false);
        }
      };
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch {
      alert("Microphone access denied or unavailable.");
    }
  }

  function stopRecording() {
    mediaRecorder?.stop();
    setRecording(false);
  }

  async function handlePrescribe(e) {
    e.preventDefault();
    setRxSubmitting(true);
    setRxSuccess("");
    try {
      await prescribeMedication({ patient_id: data.patient.id, ...rxForm });
      setRxForm({ medication_name: "", dosage_instructions: "", notes: "" });
      setRxSuccess("Prescription added.");
    } catch (err) {
      alert(err.message);
    } finally {
      setRxSubmitting(false);
    }
  }

  if (loading)
    return <p className={styles.loadingText}>Loading patient record...</p>;

  if (error) {
    return (
      <div>
        <h1 className={styles.title}>Unable to load record</h1>
        <p className={styles.error}>{error}</p>
        {errorStatus === 403 && (
          <>
            <p className={styles.hint}>
              This patient hasn&apos;t granted your facility access yet. You can
              send them a request.
            </p>
            <button
              onClick={handleRequestConsent}
              disabled={requestingConsent}
              className={styles.submitButton}
            >
              {requestingConsent ? "Sending..." : "Request access"}
            </button>
            {requestSent && <p className={styles.success}>Request sent.</p>}
          </>
        )}
      </div>
    );
  }

  const { patient, allergies, visits } = data;

  return (
    <div>
      <div className={styles.patientHeader}>
        <div>
          <h1 className={styles.title}>{patient.full_name}</h1>
          <p className={styles.subtitle}>
            {patient.system_uid} · {patient.gender} · DOB{" "}
            {patient.date_of_birth}
          </p>
        </div>
      </div>

      <div className={styles.infoGrid}>
        {patient.phone_number && (
          <InfoRow label="Phone" value={patient.phone_number} />
        )}
        {patient.national_id && (
          <InfoRow
            label={patient.id_type?.replace(/_/g, " ")}
            value={patient.national_id}
          />
        )}
        {patient.guardian_name && (
          <InfoRow
            label="Guardian"
            value={`${patient.guardian_name} (${patient.guardian_phone || "no phone"})`}
          />
        )}
      </div>

      <h2 className={styles.sectionTitle}>Allergies</h2>
      {allergies.length === 0 ? (
        <p className={styles.emptyText}>No known allergies on record.</p>
      ) : (
        <div className={styles.allergyList}>
          {allergies.map((a) => (
            <span
              key={a.id}
              className={`${styles.allergyTag} ${styles[`severity_${a.severity}`]}`}
            >
              {a.allergen} ({a.severity})
            </span>
          ))}
        </div>
      )}

      <h2 className={styles.sectionTitle}>Record consultation</h2>
      <div className={styles.card}>
        <p className={styles.cardText}>
          Record the consultation — it's transcribed and translated
          automatically.
        </p>
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={recordingLoading}
          className={
            recording ? styles.recordButtonActive : styles.recordButton
          }
        >
          {recordingLoading
            ? "Processing..."
            : recording
              ? "● Stop recording"
              : "🎙 Start recording"}
        </button>
      </div>

      <h2 className={styles.sectionTitle}>Prescribe medication</h2>
      <form onSubmit={handlePrescribe} className={styles.card}>
        {rxSuccess && <p className={styles.success}>{rxSuccess}</p>}
        <input
          placeholder="Medication name"
          value={rxForm.medication_name}
          onChange={(e) =>
            setRxForm((f) => ({ ...f, medication_name: e.target.value }))
          }
          className={styles.input}
          required
        />
        <input
          placeholder="Dosage instructions"
          value={rxForm.dosage_instructions}
          onChange={(e) =>
            setRxForm((f) => ({ ...f, dosage_instructions: e.target.value }))
          }
          className={styles.input}
        />
        <input
          placeholder="Notes (optional)"
          value={rxForm.notes}
          onChange={(e) => setRxForm((f) => ({ ...f, notes: e.target.value }))}
          className={styles.input}
        />
        <button
          type="submit"
          disabled={rxSubmitting}
          className={styles.submitButton}
        >
          {rxSubmitting ? "Adding..." : "Add prescription"}
        </button>
      </form>

      <h2 className={styles.sectionTitle}>Prescription history</h2>
      {data.prescriptions.length === 0 ? (
        <p className={styles.emptyText}>No prescriptions recorded yet.</p>
      ) : (
        <div className={styles.visitList}>
          {data.prescriptions.map((rx) => (
            <div key={rx.id} className={styles.visitCard}>
              <div className={styles.visitMeta}>
                <strong>{rx.medication_name}</strong>
                <span>{new Date(rx.created_at).toLocaleDateString()}</span>
              </div>
              {rx.dosage_instructions && (
                <p className={styles.transcript}>{rx.dosage_instructions}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 className={styles.sectionTitle}>Visit history</h2>
      {visits.length === 0 ? (
        <p className={styles.emptyText}>No visits recorded yet.</p>
      ) : (
        <div className={styles.visitList}>
          {visits.map((v) => (
            <div key={v.id} className={styles.visitCard}>
              <div className={styles.visitMeta}>
                <span>{new Date(v.visit_date).toLocaleString()}</span>
                <span className={styles.sourceTag}>
                  {v.source.replace(/_/g, " ")}
                </span>
              </div>
              {v.english_transcript && (
                <p className={styles.transcript}>{v.english_transcript}</p>
              )}
              <textarea
                value={notesDraft[v.id] || ""}
                onChange={(e) =>
                  setNotesDraft((d) => ({ ...d, [v.id]: e.target.value }))
                }
                placeholder="Add doctor's notes..."
                className={styles.notesTextarea}
                rows={3}
              />
              <button
                onClick={() => handleSaveNotes(v.id)}
                disabled={savingNotes === v.id}
                className={styles.saveNotesButton}
              >
                {savingNotes === v.id ? "Saving..." : "Save notes"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <span
        style={{
          color: "#94a3b8",
          fontSize: "0.78rem",
          textTransform: "capitalize",
        }}
      >
        {label}
      </span>
      <p
        style={{ margin: "0.15rem 0 0", fontSize: "0.92rem", color: "#0f172a" }}
      >
        {value}
      </p>
    </div>
  );
}
