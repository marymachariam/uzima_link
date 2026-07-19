"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { createVisit, createVisitFromAudio } from "@/lib/endpoints";
import styles from "./report.module.css";

function SelfReportContent() {
  const router = useRouter();
  const { user } = useAuth();

  const [mode, setMode] = useState("text");
  const [complaint, setComplaint] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setError("Could not access microphone. Please check permissions.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  function resetRecording() {
    setAudioBlob(null);
    setAudioUrl(null);
  }

  async function handleTextSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createVisit({
        patient_id: user.patientId,
        raw_transcript: complaint,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAudioSubmit() {
    if (!audioBlob) return;
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("patient_id", user.patientId);
      formData.append("audio_file", audioBlob, "recording.webm");

      await createVisitFromAudio(formData);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.thankYou}>
            <h1 className={styles.thankYouTitle}>Got it</h1>
            <p className={styles.thankYouText}>
              This has been added to your record and will be visible to your doctor
              at your next visit.
            </p>
            <button onClick={() => router.push("/patient")} className={styles.button}>
              Back to my records
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>How are you feeling today?</h1>
        <p className={styles.subtitle}>
          Describe it in your own words, typed or spoken. This will be added to your record.
        </p>

        <div className={styles.modeSwitch}>
          <button type="button" onClick={() => setMode("text")}
            className={mode === "text" ? styles.modeButtonActive : styles.modeButton}>
            ✏️ Type
          </button>
          <button type="button" onClick={() => setMode("voice")}
            className={mode === "voice" ? styles.modeButtonActive : styles.modeButton}>
            🎤 Speak
          </button>
        </div>

        {mode === "text" ? (
          <form onSubmit={handleTextSubmit}>
            <textarea
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="I've had a headache since this morning..."
              rows={6}
              className={styles.textarea}
              required
            />
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
        ) : (
          <div>
            <div className={styles.voiceBox}>
              {!audioUrl ? (
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={isRecording ? styles.micButtonRecording : styles.micButton}
                >
                  🎤
                </button>
              ) : (
                <audio controls src={audioUrl} className={styles.audioPlayer} />
              )}
              <p className={styles.voiceStatus}>
                {isRecording ? "Recording... tap to stop" : audioUrl ? "Review your recording below" : "Tap to start recording"}
              </p>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            {audioUrl && (
              <div className={styles.actionRow}>
                <button type="button" onClick={resetRecording} className={styles.secondaryButton}>
                  Re-record
                </button>
                <button type="button" onClick={handleAudioSubmit} disabled={loading}
                  className={styles.primaryButton}>
                  {loading ? "Submitting..." : "Submit recording"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SelfReportPage() {
  return (
      <SelfReportContent />
  );
}