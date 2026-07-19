"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getFacilityNotes } from "@/lib/endpoints";
import styles from "./page.module.css";

function NotesContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const result = await getFacilityNotes(user.facilityId);
        setNotes(result);
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
      <h1 className={styles.title}>Doctor's notes</h1>
      <p className={styles.subtitle}>{notes.length} documented visit{notes.length !== 1 ? "s" : ""}</p>

      <div className={styles.list}>
        {loading ? (
          <p className={styles.empty}>Loading...</p>
        ) : error ? (
          <p className={styles.errorText}>{error}</p>
        ) : notes.length === 0 ? (
          <p className={styles.empty}>No notes recorded yet.</p>
        ) : (
          notes.map((n) => (
            <button key={n.visit_id} onClick={() => router.push(`/doctor/patient/${n.patient_id}`)} className={styles.noteCard}>
              <div className={styles.noteHeader}>
                <span className={styles.notePatient}>{n.patient_name}</span>
                <span className={styles.noteDate}>{new Date(n.visit_date).toLocaleDateString()}</span>
              </div>
              <p className={styles.noteText}>{n.doctor_notes}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function NotesPage() {
  return <NotesContent />;
}