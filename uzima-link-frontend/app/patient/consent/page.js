"use client";

import { useEffect, useState } from "react";
import { getConsentRequests, respondToConsentRequest } from "@/lib/endpoints";
import styles from "./page.module.css";

export default function ConsentPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    getConsentRequests()
      .then(setRequests)
      .finally(() => setLoading(false));
  }

  async function handleRespond(id, approve) {
    setActingOn(id);
    try {
      await respondToConsentRequest(id, approve);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActingOn(null);
    }
  }

  return (
    <div>
      <h1 className={styles.title}>Consent requests</h1>
      <p className={styles.subtitle}>Facilities need your permission before they can view your record.</p>

      {loading ? (
        <p className={styles.loadingText}>Loading...</p>
      ) : requests.length === 0 ? (
        <p className={styles.emptyText}>No pending requests.</p>
      ) : (
        <div className={styles.list}>
          {requests.map((r) => (
            <div key={r.id} className={styles.card}>
              <p className={styles.cardText}>
                A facility is requesting access to your health record.
              </p>
              <p className={styles.date}>Requested {new Date(r.created_at).toLocaleString()}</p>
              <div className={styles.buttonRow}>
                <button
                  onClick={() => handleRespond(r.id, true)}
                  disabled={actingOn === r.id}
                  className={styles.approveButton}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleRespond(r.id, false)}
                  disabled={actingOn === r.id}
                  className={styles.denyButton}
                >
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}