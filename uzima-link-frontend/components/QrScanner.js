"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import styles from "./QrScanner.module.css";

export default function QrScannerModal({ onScan, onClose }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!videoRef.current) return;

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        scanner.stop();
        onScan(result.data);
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );

    scannerRef.current = scanner;

    scanner.start().catch(() => {
      setError("Couldn't access the camera. Please check permissions, or use manual search instead.");
    });

    return () => {
      scanner.stop();
      scanner.destroy();
    };
  }, [onScan]);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Scan Smart Card</h2>
          <button onClick={onClose} className={styles.closeButton}>✕</button>
        </div>

        {error ? (
          <p className={styles.error}>{error}</p>
        ) : (
          <video ref={videoRef} className={styles.video} />
        )}

        <p className={styles.hint}>Point the camera at the patient's QR code</p>
      </div>
    </div>
  );
}