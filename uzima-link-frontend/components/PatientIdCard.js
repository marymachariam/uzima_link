"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useRef } from "react";
import styles from "./PatientIdCard.module.css";

export default function PatientIdCard({ patient }) {
  const cardRef = useRef(null);

  function handleDownloadQR() {
    const canvas = cardRef.current.querySelector("canvas");
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `uzima-link-qr-${patient.system_uid}.png`;
    link.click();
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className={`${styles.wrapper} print-card-wrapper`}>
      <div className={styles.card} ref={cardRef}>
        <div className={styles.cardHeader}>
          <span className={styles.logo}>Uzima Link</span>
          <span className={styles.cardType}>Patient ID</span>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.info}>
            <p className={styles.name}>{patient.full_name}</p>
            <p className={styles.detail}>DOB: {patient.date_of_birth}</p>
            <p className={styles.detail}>{patient.gender}</p>
            <p className={styles.uid}>{patient.system_uid}</p>
          </div>

          <div className={styles.qrBox}>
            <QRCodeCanvas value={patient.system_uid} size={110} bgColor="#ffffff" fgColor="#020617" />
          </div>
        </div>

        <p className={styles.footerNote}>
          Present this code at any participating facility for instant lookup.
        </p>
      </div>

      <div className={styles.actions}>
        <button onClick={handleDownloadQR} className={styles.actionButton}>
          Download QR
        </button>
        <button onClick={handlePrint} className={styles.actionButton}>
          Print card
        </button>
      </div>
    </div>
  );
}