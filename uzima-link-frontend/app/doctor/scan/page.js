"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import QrScanner from "qr-scanner";
import styles from "./page.module.css";

export default function ScanPage() {
  const router = useRouter();
  const [systemUid, setSystemUid] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  function goToRecord(uid) {
    const clean = uid.trim().replace(/^.*\/doctor\/scan\//, "");
    if (!clean) return;
    router.push(`/doctor/scan/${clean}`);
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    goToRecord(systemUid);
  }

  async function startCameraScan() {
    setError("");
    setScanning(true);
    try {
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          scanner.stop();
          setScanning(false);
          goToRecord(result.data);
        },
        { highlightScanRegion: true }
      );
      scannerRef.current = scanner;
      await scanner.start();
    } catch {
      setError("Camera access denied or unavailable.");
      setScanning(false);
    }
  }

  function stopCameraScan() {
    scannerRef.current?.stop();
    setScanning(false);
  }

  return (
    <div>
      <h1 className={styles.title}>Scan a patient</h1>
      <p className={styles.subtitle}>Scan their health card QR code, or type their system ID manually.</p>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.scanCard}>
        <video ref={videoRef} className={`${styles.video} ${scanning ? styles.videoActive : ""}`} />
        <button onClick={scanning ? stopCameraScan : startCameraScan} className={styles.cameraButton}>
          {scanning ? "Stop camera" : "Scan with camera"}
        </button>
      </div>

      <div className={styles.divider}>or</div>

      <form onSubmit={handleManualSubmit} className={styles.form}>
        <input
          value={systemUid}
          onChange={(e) => setSystemUid(e.target.value)}
          placeholder="e.g. UZ-8f3a1c2b"
          className={styles.input}
        />
        <button type="submit" className={styles.submitButton}>Look up patient</button>
      </form>
    </div>
  );
}