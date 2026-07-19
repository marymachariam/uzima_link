"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getRecentPatients } from "@/lib/endpoints";
import styles from "./page.module.css";

function PatientsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await getRecentPatients(user.facilityId, 100);
        setPatients(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (user?.facilityId) load();
  }, [user]);

  return (
    <div>
      <h1 className={styles.title}>All patients</h1>
      <p className={styles.subtitle}>{patients.length} patient{patients.length !== 1 ? "s" : ""} at your facility</p>

      <div className={styles.list}>
        {loading ? (
          <p className={styles.empty}>Loading...</p>
        ) : error ? (
          <p className={styles.errorText}>{error}</p>
        ) : patients.length === 0 ? (
          <p className={styles.empty}>No patients yet.</p>
        ) : (
          patients.map((p) => (
            <button key={p.id} onClick={() => router.push(`/doctor/patient/${p.id}`)} className={styles.row}>
              <span className={styles.avatar}>{p.full_name?.[0]?.toUpperCase() || "?"}</span>
              <span className={styles.info}>
                <span className={styles.name}>{p.full_name}</span>
                <span className={styles.meta}>Last visit {new Date(p.last_visit).toLocaleDateString()}</span>
              </span>
              {p.has_allergy_alert && <span className={styles.alertBadge}>Allergy alert</span>}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function PatientsPage() {
  return <PatientsContent />;
}