"use client";

import { useEffect, useState } from "react";
import {
  logSymptomsText,
  logSymptomsVoice,
  getSymptomHistory,
} from "@/lib/endpoints";
import styles from "./page.module.css";
import { 
  Activity, 
  Mic, 
  Square, 
  Send, 
  AlertCircle, 
  Clock, 
  Stethoscope, 
  Sparkles,
  MessageSquare
} from "lucide-react";

export default function SymptomsPage() {
  const [text, setText] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  function loadHistory() {
    setLoadingHistory(true);
    getSymptomHistory()
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }

  async function handleTextSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setError("");
    setLoading(true);
    try {
      await logSymptomsText(text);
      setText("");
      loadHistory();
    } catch (err) {
      setError(err.message || "Failed to log symptoms. Please try again.");
    } finally {
      setLoading(false);
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
        formData.append("file", blob, "recording.webm");
        setLoading(true);
        try {
          await logSymptomsVoice(formData);
          loadHistory();
        } catch (err) {
          setError(err.message || "Voice upload failed.");
        } finally {
          setLoading(false);
        }
      };
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      setError("");
    } catch {
      setError("Microphone access denied or unavailable.");
    }
  }

  function stopRecording() {
    mediaRecorder?.stop();
    setRecording(false);
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerBadge}>
          <Sparkles size={14} /> AI Voice & Text Triage
        </div>
        <h1 className={styles.title}>How are you feeling today?</h1>
        <p className={styles.subtitle}>
          Describe your symptoms in your own words — type or record in any language. Our automated speech recognition will process it instantly.
        </p>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Input Form Card */}
      <form onSubmit={handleTextSubmit} className={styles.formCard}>
        <div className={styles.textareaWrapper}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. I've had a persistent headache and high fever since yesterday evening..."
            className={styles.textarea}
            rows={4}
            disabled={recording}
          />
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            className={recording ? styles.recordButtonActive : styles.recordButton}
          >
            {recording ? (
              <>
                <span className={styles.pulseDot} />
                <Square size={16} /> Stop Recording
              </>
            ) : (
              <>
                <Mic size={16} /> Record Voice Note
              </>
            )}
          </button>

          <button
            type="submit"
            disabled={loading || !text.trim()}
            className={styles.submitButton}
          >
            {loading ? (
              <span className={styles.submittingState}>
                <span className={styles.spinner} /> Submitting...
              </span>
            ) : (
              <>
                <Send size={16} /> Log Symptoms
              </>
            )}
          </button>
        </div>
      </form>

      {/* History Section */}
      <div className={styles.historySection}>
        <div className={styles.historyHeader}>
          <h2 className={styles.historyTitle}>Symptom History</h2>
          <span className={styles.historyCount}>{history.length} entries recorded</span>
        </div>

        {loadingHistory ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinnerDark} />
            <p className={styles.loadingText}>Loading your history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className={styles.emptyContainer}>
            <Activity size={36} className={styles.emptyIcon} />
            <p className={styles.emptyText}>No symptom entries yet. Log how you feel above to get started.</p>
          </div>
        ) : (
          <div className={styles.historyList}>
            {history.map((entry) => (
              <div key={entry.id} className={styles.historyCard}>
                <div className={styles.historyMeta}>
                  <div className={styles.dateWrapper}>
                    <Clock size={14} />
                    <span>{new Date(entry.visit_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <span className={styles.sourceTag}>
                    <MessageSquare size={12} />
                    {entry.source.replace(/_/g, " ")}
                  </span>
                </div>

                {entry.source === "doctor_note" ? (
                  <p className={styles.historyTextMuted}>
                    <em>No symptoms logged for this entry — see doctor's clinical notes below.</em>
                  </p>
                ) : (
                  <p className={styles.historyText}>
                    {entry.english_transcript || entry.raw_transcript}
                  </p>
                )}

                {entry.doctor_notes && (
                  <div className={styles.doctorNoteBox}>
                    <div className={styles.doctorNoteHeader}>
                      <Stethoscope size={15} />
                      <span className={styles.doctorNoteLabel}>Note from your doctor</span>
                    </div>
                    <p className={styles.doctorNoteText}>{entry.doctor_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}