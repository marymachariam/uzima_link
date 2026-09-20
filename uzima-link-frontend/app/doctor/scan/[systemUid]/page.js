"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getDoctorPatientRecord,
  updateVisitNotes,
  recordConsultation,
  prescribeMedication,
  requestPatientConsent,
  addDoctorNote,
} from "@/lib/endpoints";
import {
  User,
  Phone,
  Calendar,
  AlertTriangle,
  Mic,
  Square,
  FileText,
  Pill,
  ShieldCheck,
  Lock,
  CheckCircle2,
  PlusCircle,
  Clock,
  Activity,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
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

  const [quickNote, setQuickNote] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);

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
        res.visits?.forEach((v) => (drafts[v.id] = v.doctor_notes || ""));
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

  async function handleAddNote(e) {
    e.preventDefault();
    if (!quickNote.trim()) return;
    setNoteSubmitting(true);
    try {
      await addDoctorNote(data.patient.id, quickNote);
      setQuickNote("");
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setNoteSubmitting(false);
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
      setRxSuccess("Prescription added successfully.");
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setRxSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Securely loading patient clinical profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <Lock size={40} className={styles.lockIcon} />
          <h1 className={styles.errorTitle}>Access Restricted or Record Not Found</h1>
          <p className={styles.errorText}>{error}</p>
          {errorStatus === 403 && (
            <div className={styles.consentBox}>
              <p className={styles.hint}>
                This patient has not granted your facility active consent yet. You can dispatch an immediate access request to their device.
              </p>
              <button
                onClick={handleRequestConsent}
                disabled={requestingConsent}
                className={styles.primaryButton}
              >
                {requestingConsent ? "Transmitting Request..." : "Request Patient Consent"}
              </button>
              {requestSent && (
                <p className={styles.successMessage}>
                  <CheckCircle2 size={16} /> Consent request successfully sent.
                </p>
              )}
            </div>
          )}
          <Link href="/doctor/scan" className={styles.backLink}>
            <ArrowLeft size={16} /> Return to Scanner
          </Link>
        </div>
      </div>
    );
  }

  const { patient, allergies = [], visits = [], prescriptions = [] } = data;

  return (
    <div className={styles.pageContainer}>
      
      {/* Top Navigation & Header Card */}
      <div className={styles.patientHero}>
        <div className={styles.heroTopRow}>
          <Link href="/doctor/scan" className={styles.backButton}>
            <ArrowLeft size={16} /> Back to Scanner
          </Link>
          <span className={styles.systemIdBadge}>System ID: {patient.system_uid}</span>
        </div>

        <div className={styles.heroMain}>
          <div className={styles.avatarCircle}>
            <User size={32} />
          </div>
          <div className={styles.patientDetails}>
            <h1 className={styles.patientName}>{patient.full_name}</h1>
            <p className={styles.patientMeta}>
              <span>{patient.gender || "Not specified"}</span>
              <span className={styles.dot}>•</span>
              <span>DOB: {patient.date_of_birth || "Unknown"}</span>
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className={styles.infoGrid}>
          {patient.phone_number && (
            <div className={styles.infoItem}>
              <Phone size={16} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Phone Number</span>
                <span className={styles.infoValue}>{patient.phone_number}</span>
              </div>
            </div>
          )}
          {patient.national_id && (
            <div className={styles.infoItem}>
              <ShieldCheck size={16} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>{patient.id_type?.replace(/_/g, " ") || "Identification"}</span>
                <span className={styles.infoValue}>{patient.national_id}</span>
              </div>
            </div>
          )}
          {patient.guardian_name && (
            <div className={styles.infoItem}>
              <User size={16} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Guardian Contact</span>
                <span className={styles.infoValue}>{patient.guardian_name} ({patient.guardian_phone || "No phone"})</span>
              </div>
            </div>
          )}
        </div>

        {/* Allergies Bar */}
        <div className={styles.allergySection}>
          <span className={styles.allergyHeaderTitle}>
            <AlertTriangle size={16} className={styles.warningIcon} /> Known Allergies:
          </span>
          {allergies.length === 0 ? (
            <span className={styles.noAllergyText}>No known allergies recorded.</span>
          ) : (
            <div className={styles.allergyList}>
              {allergies.map((a) => (
                <span key={a.id} className={`${styles.allergyTag} ${styles[`severity_${a.severity}`]}`}>
                  {a.allergen} ({a.severity})
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left Column (Tools & Inputs) vs Right Column (History) */}
      <div className={styles.workspaceGrid}>
        
        {/* Left Column: Active Clinical Actions */}
        <div className={styles.column}>
          
          {/* Audio Consultation Recorder */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Mic size={20} className={styles.cardIconActive} />
              <h2 className={styles.cardTitle}>AI Voice Consultation</h2>
            </div>
            <p className={styles.cardDesc}>
              Record the live doctor-patient dialogue. Audio is transcribed, translated, and automatically indexed into records.
            </p>
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={recordingLoading}
              className={recording ? styles.recordButtonActive : styles.recordButton}
            >
              {recordingLoading ? (
                <span>Processing Audio...</span>
              ) : recording ? (
                <>
                  <span className={styles.pulseDot}></span> Stop Recording
                </>
              ) : (
                <>
                  <Mic size={18} /> Start Live Voice Recording
                </>
              )}
            </button>
          </div>

          {/* Quick Doctor Note */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FileText size={20} className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Add Clinical Note</h2>
            </div>
            <form onSubmit={handleAddNote} className={styles.formStack}>
              <textarea
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                placeholder="Type observations, treatment plans, or follow-up instructions..."
                className={styles.textarea}
                rows={3}
              />
              <button
                type="submit"
                disabled={noteSubmitting || !quickNote.trim()}
                className={styles.submitButton}
              >
                {noteSubmitting ? "Saving Note..." : "Save Clinical Note"}
              </button>
            </form>
          </div>

          {/* Prescribe Medication */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Pill size={20} className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Prescribe Medication</h2>
            </div>
            <form onSubmit={handlePrescribe} className={styles.formStack}>
              {rxSuccess && (
                <p className={styles.successBanner}>
                  <CheckCircle2 size={16} /> {rxSuccess}
                </p>
              )}
              <input
                placeholder="Medication name (e.g. Amoxicillin 500mg)"
                value={rxForm.medication_name}
                onChange={(e) => setRxForm((f) => ({ ...f, medication_name: e.target.value }))}
                className={styles.input}
                required
              />
              <input
                placeholder="Dosage instructions (e.g. Twice daily for 5 days)"
                value={rxForm.dosage_instructions}
                onChange={(e) => setRxForm((f) => ({ ...f, dosage_instructions: e.target.value }))}
                className={styles.input}
              />
              <input
                placeholder="Additional notes / warnings (optional)"
                value={rxForm.notes}
                onChange={(e) => setRxForm((f) => ({ ...f, notes: e.target.value }))}
                className={styles.input}
              />
              <button
                type="submit"
                disabled={rxSubmitting}
                className={styles.submitButton}
              >
                {rxSubmitting ? "Issuing Prescription..." : "Issue Prescription"}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Historical Data & Transcripts */}
        <div className={styles.column}>
          
          {/* Visit History & Transcripts */}
          <div className={styles.sectionHeaderBlock}>
            <h2 className={styles.sectionHeading}>Clinical Visit History</h2>
            <span className={styles.countBadge}>{visits.length} Visits</span>
          </div>

          {visits.length === 0 ? (
            <div className={styles.emptyCard}>
              <Activity size={32} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No previous visits recorded.</p>
              <p className={styles.emptySub}>Consultation transcripts and visit logs will appear here.</p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {visits.map((v) => (
                <div key={v.id} className={styles.historyCard}>
                  <div className={styles.historyMetaRow}>
                    <span className={styles.visitDate}>
                      <Clock size={14} /> {new Date(v.visit_date).toLocaleString()}
                    </span>
                    <span className={styles.sourceTag}>
                      {v.source?.replace(/_/g, " ")}
                    </span>
                  </div>

                  {v.english_transcript && (
                    <div className={styles.transcriptBox}>
                      <span className={styles.transcriptLabel}>AI Transcription & Translation:</span>
                      <p className={styles.transcriptText}>{v.english_transcript}</p>
                    </div>
                  )}

                  <div className={styles.notesEditorGroup}>
                    <label className={styles.notesLabel}>Doctor & Facility Notes:</label>
                    <textarea
                      value={notesDraft[v.id] || ""}
                      onChange={(e) => setNotesDraft((d) => ({ ...d, [v.id]: e.target.value }))}
                      placeholder="Add or update confidential clinical notes..."
                      className={styles.textarea}
                      rows={2}
                    />
                    <button
                      onClick={() => handleSaveNotes(v.id)}
                      disabled={savingNotes === v.id}
                      className={styles.secondaryButton}
                    >
                      {savingNotes === v.id ? "Saving..." : "Update Notes"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Prescription History */}
          <div className={styles.sectionHeaderBlock} style={{ marginTop: "24px" }}>
            <h2 className={styles.sectionHeading}>Active & Past Prescriptions</h2>
            <span className={styles.countBadge}>{prescriptions.length} Rx</span>
          </div>

          {prescriptions.length === 0 ? (
            <div className={styles.emptyCard}>
              <Pill size={32} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No prescriptions on file.</p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {prescriptions.map((rx) => (
                <div key={rx.id} className={styles.prescriptionCard}>
                  <div className={styles.historyMetaRow}>
                    <strong className={styles.rxName}>{rx.medication_name}</strong>
                    <span className={styles.visitDate}>{new Date(rx.created_at).toLocaleDateString()}</span>
                  </div>
                  {rx.dosage_instructions && (
                    <p className={styles.rxInstructions}>{rx.dosage_instructions}</p>
                  )}
                  {rx.notes && <p className={styles.rxNotes}>Note: {rx.notes}</p>}
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}