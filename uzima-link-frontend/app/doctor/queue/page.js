"use client";

import { useEffect, useState } from "react";
import {
  getDoctorQueue,
  startQueueConsultation,
  completeQueueConsultation,
} from "@/lib/endpoints";
import styles from "./page.module.css";

export default function DoctorQueuePage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    getDoctorQueue()
      .then(setQueue)
      .finally(() => setLoading(false));
  }

  async function handleStart(id) {
    setActingOn(id);
    try {
      await startQueueConsultation(id);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActingOn(null);
    }
  }

  async function handleComplete(id) {
    setActingOn(id);
    try {
      await completeQueueConsultation(id);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActingOn(null);
    }
  }

  return (
    <div>
      <h1 className={styles.title}>Today&apos;s queue</h1>
      <p className={styles.subtitle}>
        Patients checked in at your facility. Use Scan to open a patient&apos;s
        full record.
      </p>

      {loading ? (
        <p className={styles.loadingText}>Loading...</p>
      ) : queue.length === 0 ? (
        <p className={styles.emptyText}>No one in the queue right now.</p>
      ) : (
        <div className={styles.list}>
          {queue.map((entry) => (
            <div key={entry.id} className={styles.card}>
              <div>
                {entry.patient_system_uid ? (
                  <Link
                    href={`/doctor/scan/${entry.patient_system_uid}`}
                    className={styles.patientLink}
                  >
                    {entry.patient_name || "Unknown patient"}
                  </Link>
                ) : (
                  <strong>{entry.patient_name || "Unknown patient"}</strong>
                )}
                <div>
                  <span
                    className={`${styles.statusTag} ${styles[`status_${entry.status}`]}`}
                  >
                    {entry.status.replace(/_/g, " ")}
                  </span>
                  <p className={styles.time}>
                    Checked in {new Date(entry.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className={styles.actions}>
                {entry.status === "waiting" && (
                  <button
                    onClick={() => handleStart(entry.id)}
                    disabled={actingOn === entry.id}
                    className={styles.startButton}
                  >
                    Start
                  </button>
                )}
                {entry.status === "in_progress" && (
                  <button
                    onClick={() => handleComplete(entry.id)}
                    disabled={actingOn === entry.id}
                    className={styles.completeButton}
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
