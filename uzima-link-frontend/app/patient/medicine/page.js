"use client";

import { useEffect, useRef, useState } from "react";
import { checkMedicine, checkMedicineByImage, checkMedicineByVoice } from "@/lib/endpoints";
import styles from "./page.module.css";
import { 
  Pill, 
  Search, 
  Mic, 
  Square, 
  Camera, 
  AlertTriangle, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  Info, 
  Video, 
  ExternalLink 
} from "lucide-react";

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
      setError(err.message || "Failed to check medicine. Please try again.");
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
    <div className={styles.pageContainer}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerBadge}>
          <Sparkles size={14} /> AI Pharmaceutical Verification
        </div>
        <h1 className={styles.title}>Check a Medicine</h1>
        <p className={styles.subtitle}>
          Verify authenticity, safety details, dosages, and warnings. Type the name, say it aloud, or upload a photo of the package.
        </p>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Search Form Card */}
      <div className={styles.searchCard}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Paracetamol, Amoxicillin..."
              className={styles.input}
              disabled={recording || loading}
            />
          </div>
          <button type="submit" disabled={loading || recording || !name.trim()} className={styles.submitButton}>
            {loading ? (
              <span className={styles.submittingState}>
                <span className={styles.spinner} /> Checking...
              </span>
            ) : (
              <>Search</>
            )}
          </button>
        </form>

        <div className={styles.actionDivider}>
          <span>or use interactive inputs</span>
        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            disabled={loading}
            className={`${styles.secondaryButton} ${recording ? styles.recordingButton : ""}`}
          >
            {recording ? (
              <>
                <span className={styles.pulseDot} />
                <Square size={16} /> Stop Recording
              </>
            ) : (
              <>
                <Mic size={16} /> Say the Name
              </>
            )}
          </button>

          <label className={`${styles.secondaryButton} ${styles.uploadLabel}`}>
            <Camera size={16} /> Take or Upload Photo
            <input type="file" accept="image/*" capture="environment" onChange={handleImage} hidden disabled={loading} />
          </label>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className={styles.resultCard}>
          {result.found ? (
            <>
              <div className={styles.resultHeader}>
                <div className={styles.resultTitleWrapper}>
                  <ShieldCheck size={22} className={styles.resultIconVerified} />
                  <h3 className={styles.resultTitle}>{result.brand_name || result.generic_name || result.query}</h3>
                </div>
                <span className={styles.verifiedTag}>Verified Safe</span>
              </div>

              <div className={styles.resultGrid}>
                {result.generic_name && (
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Generic Name</span>
                    <span className={styles.resultValue}>{result.generic_name}</span>
                  </div>
                )}
                {result.purpose && (
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Primary Purpose</span>
                    <span className={styles.resultValue}>{result.purpose}</span>
                  </div>
                )}
                {result.dosage_info && (
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Dosage & Usage</span>
                    <span className={styles.resultValue}>{result.dosage_info}</span>
                  </div>
                )}
              </div>

              {result.warnings && (
                <div className={styles.warningsBox}>
                  <div className={styles.warningsHeader}>
                    <AlertTriangle size={18} className={styles.warningIcon} />
                    <span className={styles.warningsLabel}>Safety Warnings</span>
                  </div>
                  <p className={styles.warningsText}>{result.warnings}</p>
                </div>
              )}

              {embedUrl ? (
                <div className={styles.videoSection}>
                  <div className={styles.videoHeader}>
                    <Video size={16} />
                    <span>Explainer & Instructions Video</span>
                  </div>
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
                </div>
              ) : result.video_url ? (
                <div className={styles.videoLinkWrapper}>
                  <a href={result.video_url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                    <ExternalLink size={16} /> Watch an explainer video
                  </a>
                </div>
              ) : null}
            </>
          ) : result.query ? (
            <div className={styles.notFoundContainer}>
              <AlertCircle size={32} className={styles.notFoundIcon} />
              <p className={styles.notFound}>No pharmaceutical information found for &quot;{result.query}&quot;.</p>
            </div>
          ) : null}

          {result.note && (
            <div className={styles.noteBox}>
              <Info size={14} className={styles.noteIcon} />
              <p className={styles.note}>{result.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}