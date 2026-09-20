"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPrescriptions } from "@/lib/endpoints";
import styles from "./page.module.css";

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrescriptions()
      .then(setPrescriptions)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className={styles.title}>Your prescriptions</h1>
      <p className={styles.subtitle}>Medication your doctors have prescribed.</p>

      {loading ? (
        <p className={styles.loadingText}>Loading...</p>
      ) : prescriptions.length === 0 ? (
        <p className={styles.emptyText}>No prescriptions yet.</p>
      ) : (
        <div className={styles.list}>
          {prescriptions.map((p) => (
            <div key={p.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <strong>{p.medication_name}</strong>
                <span className={styles.date}>{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
              {p.dosage_instructions && <p className={styles.dosage}>{p.dosage_instructions}</p>}
              {p.notes && <p className={styles.notes}>{p.notes}</p>}
              <Link href={`/patient/medicine?name=${encodeURIComponent(p.medication_name)}`} className={styles.verifyLink}>
                Verify this medicine →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}