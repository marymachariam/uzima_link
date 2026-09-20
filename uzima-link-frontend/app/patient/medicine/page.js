"use client";

import { useEffect, useRef, useState } from "react";
import { checkMedicine, checkMedicineByImage, checkMedicineByVoice } from "@/lib/endpoints";
import styles from "./page.module.css";

function getEmbedUrl(url) {
  try {
    const id = new URL(url).searchParams.get("v");
    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

export default function MedicinePage() {
  const [name, setName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  async function run(request, fillName = false) {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await request();
      setResult(res);
      if (fillName && res.query) setName(res.query);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    run(() => checkMedicine(name.trim()));
  }

  function handleImage(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    run(() => checkMedicineByImage(formData), true);
  }

  function submitVoice(blob, filename) {
    const formData = new FormData();
    formData.append("audio", blob, filename);
    run(() => checkMedicineByVoice(formData), true);
  }

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = ["audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t)) || "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        submitVoice(blob, type.includes("mp4") ? "recording.mp4" : "recording.webm");
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("Could not access the microphone. Please allow microphone access and try again.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  const embedUrl = result?.video_url ? getEmbedUrl(result.video_url) : null;

  return (
    <div>
      <h1 className={styles.title}>Check a medicine</h1>
      <p className={styles.subtitle}>Type the name, say it, or take a photo of the package.</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Paracetamol"
          className={styles.input}
        />
        <button type="submit" disabled={loading || recording} className={styles.submitButton}>
          {loading ? "Checking..." : "Check"}
        </button>
      </form>

      <div className={styles.actionRow}>
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          disabled={loading}
          className={`${styles.secondaryButton} ${recording ? styles.recordingButton : ""}`}
        >
          {recording ? "Stop recording" : "Say the name"}
        </button>
        <label className={styles.secondaryButton}>
          Take or upload a photo
          <input type="file" accept="image/*" capture="environment" onChange={handleImage} hidden />
        </label>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {result && (
        <div className={styles.resultCard}>
          {result.found ? (
            <>
              <h3 className={styles.resultTitle}>{result.brand_name || result.generic_name || result.query}</h3>
              {result.generic_name && <p className={styles.resultRow}><strong>Generic name:</strong> {result.generic_name}</p>}
              {result.purpose && <p className={styles.resultRow}><strong>Purpose:</strong> {result.purpose}</p>}
              {result.warnings && <p className={styles.resultRow}><strong>Warnings:</strong> {result.warnings}</p>}
              {result.dosage_info && <p className={styles.resultRow}><strong>Dosage:</strong> {result.dosage_info}</p>}
              {embedUrl ? (
                <div className={styles.videoWrap}>
                  <iframe
                    src={embedUrl}
                    title="Medicine explainer video"
                    allow="encrypted-media; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className={styles.video}
                  />
                </div>
              ) : result.video_url ? (
                <p className={styles.resultRow}>
                  <a href={result.video_url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                    Watch an explainer video
                  </a>
                </p>
              ) : null}
            </>
          ) : result.query ? (
            <p className={styles.notFound}>No information found for &quot;{result.query}&quot;.</p>
          ) : null}
          <p className={styles.note}>{result.note}</p>
        </div>
      )}
    </div>
  );
}