"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import QrScanner from "qr-scanner";
import { QrCode, Camera, Search, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
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
      setError("Camera access denied or unavailable. Please check your browser permissions.");
      setScanning(false);
    }
  }

  function stopCameraScan() {
    scannerRef.current?.stop();
    setScanning(false);
  }

  return (
    <div className={styles.pageContainer}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerIconWrapper}>
          <QrCode size={28} />
        </div>
        <div>
          <h1 className={styles.title}>Scan Patient Health Card</h1>
          <p className={styles.subtitle}>
            Use your device camera to scan a patient&apos;s QR code or enter their System ID manually.
          </p>
        </div>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={20} className={styles.errorIcon} />
          <span>{error}</span>
        </div>
      )}

      {/* Interactive Main Grid */}
      <div className={styles.scanGrid}>
        
        {/* Camera Card */}
        <div className={styles.scanCard}>
          <div className={styles.cardHeaderContent}>
            <div className={styles.cardBadge}>Method 1</div>
            <h2 className={styles.cardTitle}>Camera QR Scanner</h2>
            <p className={styles.cardDesc}>Point your webcam or phone camera at the patient&apos;s digital card.</p>
          </div>

          <div className={styles.videoContainer}>
            <video 
              ref={videoRef} 
              className={`${styles.video} ${scanning ? styles.videoActive : ""}`} 
            />
            {!scanning && (
              <div className={styles.videoPlaceholder}>
                <Camera size={48} className={styles.placeholderIcon} />
                <span>Camera feed is offline</span>
              </div>
            )}
            {scanning && (
              <div className={styles.scanningOverlay}>
                <div className={styles.scanLaser}></div>
                <span className={styles.scanningText}>Align QR code within frame...</span>
              </div>
            )}
          </div>

          <button 
            onClick={scanning ? stopCameraScan : startCameraScan} 
            className={scanning ? styles.stopButton : styles.cameraButton}
          >
            <Camera size={18} />
            {scanning ? "Stop Camera Feed" : "Activate Camera Scanner"}
          </button>
        </div>

        {/* Manual Lookup Card */}
        <div className={styles.manualCard}>
          <div className={styles.cardHeaderContent}>
            <div className={styles.cardBadge}>Method 2</div>
            <h2 className={styles.cardTitle}>Manual System ID Lookup</h2>
            <p className={styles.cardDesc}>If the QR code is unreadable, type the unique system identifier directly.</p>
          </div>

          <form onSubmit={handleManualSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <Search size={20} className={styles.inputIcon} />
              <input
                value={systemUid}
                onChange={(e) => setSystemUid(e.target.value)}
                placeholder="e.g. UZ-8f3a1c2b"
                className={styles.input}
              />
            </div>
            <button type="submit" className={styles.submitButton}>
              <span>Look up patient record</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className={styles.securityNote}>
            <ShieldCheck size={16} className={styles.securityIcon} />
            <span>All record lookups are securely logged for medical audit compliance.</span>
          </div>
        </div>

      </div>
    </div>
  );
}