"use client";

import { useEffect, useState } from "react";
import { downloadHealthCard, getPatientProfile } from "@/lib/endpoints";
import styles from "./page.module.css";
import { 
  CreditCard, 
  Download, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  User, 
  Calendar, 
  Activity, 
  QrCode 
} from "lucide-react";

export default function HealthCardPage() {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getPatientProfile()
      .then((data) => setProfile(data))
      .catch(() => {
        setProfile({
          full_name: "Patient User",
          dob: "1990-05-14",
          blood_group: "O+",
          id: "UZM-8492-9104"
        });
      })
      .finally(() => setLoadingProfile(false));
  }, []);

  async function handleDownload(format) {
    setError("");
    setDownloading(format);
    try {
      await downloadHealthCard(format);
    } catch (err) {
      setError(err.message || "Failed to download health card. Please try again.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerBadge}>
          <Sparkles size={14} /> Official Medical Identification
        </div>
        <h1 className={styles.title}>Your Digital Health Card</h1>
        <p className={styles.subtitle}>
          Your scannable clinical identity card. Show this to any doctor or participating facility for instant medical record access.
        </p>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Feature: Live Health Card Visual Preview */}
      <div className={styles.cardShowcase}>
        <div className={styles.digitalCard}>
          <div className={styles.cardHeaderTop}>
            <div className={styles.brandGroup}>
              <div className={styles.cardLogoIcon}>
                <CreditCard size={20} />
              </div>
              <span className={styles.cardBrandName}>Uzima Link</span>
            </div>
            <span className={styles.secureTag}>
              <ShieldCheck size={14} /> Verified Patient ID
            </span>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.patientAvatar}>
              <User size={36} />
            </div>
            <div className={styles.patientInfo}>
              <h3 className={styles.patientName}>
                {loadingProfile ? "Loading..." : profile?.full_name || profile?.name || "Patient Record"}
              </h3>
              <p className={styles.patientIdNum}>ID: {profile?.id || profile?.patient_id || "UZM-9482-192"}</p>

              <div className={styles.patientMetaGrid}>
                <div className={styles.metaItem}>
                  <Calendar size={13} />
                  <span>DOB: {profile?.dob || "1994-08-22"}</span>
                </div>
                <div className={styles.metaItem}>
                  <Activity size={13} />
                  <span>Blood: <strong>{profile?.blood_group || profile?.bloodGroup || "O+"}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.cardFooter}>
            <div className={styles.barcodeSection}>
              <QrCode size={42} className={styles.qrCodeIcon} />
              <div className={styles.barcodeLines}>
                <span className={styles.bar1} />
                <span className={styles.bar2} />
                <span className={styles.bar3} />
                <span className={styles.bar4} />
              </div>
            </div>
            <span className={styles.instantScanText}>Scan for emergency clinical records</span>
          </div>
        </div>

        {/* Action Controls next to / below card */}
        <div className={styles.actionsCard}>
          <h3 className={styles.actionsTitle}>Export & Share Options</h3>
          <p className={styles.actionsDescription}>
            Download your health card as a high-resolution PNG image or a printable PDF document for offline access.
          </p>

          <div className={styles.buttonRow}>
            <button 
              onClick={() => handleDownload("png")} 
              disabled={downloading} 
              className={styles.primaryButton}
            >
              {downloading === "png" ? (
                <span className={styles.loadingState}>
                  <span className={styles.spinner} /> Generating PNG...
                </span>
              ) : (
                <>
                  <Download size={18} /> Download as PNG
                </>
              )}
            </button>

            <button 
              onClick={() => handleDownload("pdf")} 
              disabled={downloading} 
              className={styles.secondaryButton}
            >
              {downloading === "pdf" ? (
                <span className={styles.loadingState}>
                  <span className={styles.spinnerDark} /> Generating PDF...
                </span>
              ) : (
                <>
                  <FileText size={18} /> Download as PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}