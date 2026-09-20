"use client";

import { useState } from "react";
import { downloadHealthCard } from "@/lib/endpoints";
import styles from "./page.module.css";

export default function HealthCardPage() {
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState("");

  async function handleDownload(format) {
    setError("");
    setDownloading(format);
    try {
      await downloadHealthCard(format);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div>
      <h1 className={styles.title}>Your health card</h1>
      <p className={styles.subtitle}>
        A scannable card with your key details and allergies. Show this to any doctor at any participating facility.
      </p>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.card}>
        <p className={styles.cardText}>
          Download your card as an image or a PDF — either works for showing a doctor or printing.
        </p>
        <div className={styles.buttonRow}>
          <button onClick={() => handleDownload("png")} disabled={downloading} className={styles.primaryButton}>
            {downloading === "png" ? "Downloading..." : "Download as PNG"}
          </button>
          <button onClick={() => handleDownload("pdf")} disabled={downloading} className={styles.secondaryButton}>
            {downloading === "pdf" ? "Downloading..." : "Download as PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}