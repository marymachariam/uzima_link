"use client";

import { useEffect, useState } from "react";
import { logSymptomsText, logSymptomsVoice, getSymptomHistory } from "@/lib/endpoints";
import styles from "./page.module.css";

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
      setError(err.message);
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
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch {
      setError("Microphone access denied or unavailable.");
    }
  }

  function stopRecording() {
    mediaRecorder?.stop();
    setRecording(false);
  }

  return (
    <div>
      <h1 className={styles.title}>How are you feeling?</h1>
      <p className={styles.subtitle}>Describe your symptoms in your own words — text or voice, any language.</p>

      {error && <p className={styles.error}>{error}</p>}

      <form onSubmit={handleTextSubmit} className={styles.form}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. I've had a headache and fever since yesterday..."
          className={styles.textarea}
          rows={4}
        />
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            className={recording ? styles.recordButtonActive : styles.recordButton}
          >
            {recording ? "● Stop recording" : "🎙 Record instead"}
          </button>
          <button type="submit" disabled={loading || !text.trim()} className={styles.submitButton}>
            {loading ? "Submitting..." : "Log symptoms"}
          </button>
        </div>
      </form>

      <h2 className={styles.historyTitle}>History</h2>
      {loadingHistory ? (
        <p className={styles.loadingText}>Loading...</p>
      ) : history.length === 0 ? (
        <p className={styles.emptyText}>No symptom entries yet.</p>
      ) : (
        <div className={styles.historyList}>
          {history.map((entry) => (
            <div key={entry.id} className={styles.historyCard}>
              <div className={styles.historyMeta}>
                <span>{new Date(entry.visit_date).toLocaleDateString()}</span>
                <span className={styles.sourceTag}>{entry.source.replace(/_/g, " ")}</span>
              </div>
              <p className={styles.historyText}>{entry.english_transcript || entry.raw_transcript}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}