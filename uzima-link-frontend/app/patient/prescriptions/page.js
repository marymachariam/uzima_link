"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPrescriptions } from "@/lib/endpoints";
import styles from "./page.module.css";
import { Pill, Calendar, FileText, Sparkles, AlertCircle, ArrowRight } from "lucide-react";

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrescriptions()
      .then((data) => setPrescriptions(data || []))
      .catch(() => setPrescriptions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.pageContainer}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerBadge}>
          <Sparkles size={14} /> Clinical Records
        </div>
        <h1 className={styles.title}>Your Prescriptions</h1>
        <p className={styles.subtitle}>
          Active medications prescribed by your authorized care providers.
        </p>
      </div>

      {loading ? (
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <span>Loading your prescriptions...</span>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className={styles.emptyBox}>
          <FileText size={36} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No Prescriptions Found</p>
          <p className={styles.emptyText}>You do not have any active medication prescriptions on record yet.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {prescriptions.map((p) => (
            <div key={p.id || p.medication_name} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.medNameWrapper}>
                  <div className={styles.medIconBox}>
                    <Pill size={18} />
                  </div>
                  <h3 className={styles.medName}>{p.medication_name}</h3>
                </div>
                <div className={styles.dateTag}>
                  <Calendar size={13} />
                  <span>{p.created_at ? new Date(p.created_at).toLocaleDateString() : "Recent"}</span>
                </div>
              </div>

              {p.dosage_instructions && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Dosage:</span>
                  <p className={styles.dosage}>{p.dosage_instructions}</p>
                </div>
              )}

              {p.notes && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Notes:</span>
                  <p className={styles.notes}>{p.notes}</p>
                </div>
              )}

              <div className={styles.cardFooter}>
                <Link 
                  href={`/patient/medicine?name=${encodeURIComponent(p.medication_name)}`} 
                  className={styles.verifyLink}
                >
                  Verify this medicine <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}