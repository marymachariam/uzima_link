"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getRecentPatients } from "@/lib/endpoints";
import styles from "./doctor.module.css";

function QueueContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.facilityId) {
        setError("No facility linked to this account.");
        setLoading(false);
        return;
      }
      try {
        const result = await getRecentPatients(user.facilityId);
        setPatients(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const alertCount = patients.filter((p) => p.has_allergy_alert).length;
  const today = new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Recent patients</h1>
          <p className={styles.subtitle}>
            {today} · {patients.length} patient{patients.length !== 1 ? "s" : ""} seen recently
          </p>
        </div>
        <button onClick={() => router.push("/doctor/search")} className={styles.searchBar}>
          🔍 Find patient
        </button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <p className={styles.statLabel}>Recent patients</p>
          <p className={styles.statValue}>{patients.length}</p>
        </div>
        <div className={styles.statBoxAlert}>
          <p className={styles.statLabel}>Allergy alerts</p>
          <p className={styles.statValueAlert}>{alertCount}</p>
        </div>
      </div>

      <div className={styles.list}>
        {loading ? (
          <p className={styles.empty}>Loading...</p>
        ) : error ? (
          <p className={styles.errorText}>{error}</p>
        ) : patients.length === 0 ? (
          <p className={styles.empty}>No recent patients at your facility yet.</p>
        ) : (
          patients.map((p) => (
            <button
              key={p.id}
              onClick={() => router.push(`/doctor/patient/${p.id}`)}
              className={styles.patientRow}
            >
              <span className={styles.avatar}>{p.full_name?.[0]?.toUpperCase() || "?"}</span>
              <span className={styles.info}>
                <span className={styles.name}>{p.full_name}</span>
                <span className={styles.meta}>
                  Last visit {new Date(p.last_visit).toLocaleDateString()}
                </span>
              </span>
              {p.has_allergy_alert ? (
                <span className={styles.alertBadge}>Allergy alert</span>
              ) : (
                <span className={styles.okBadge}>No alerts</span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function DoctorPage() {
  return <QueueContent />;
}