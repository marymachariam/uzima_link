"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDoctorPatientRecord, requestPatientConsent } from "@/lib/endpoints";
import styles from "./page.module.css";


const recordPath = (uid) => `/doctor/patients/${encodeURIComponent(uid)}`;

const POLL_EVERY_SECONDS = 3;
const GIVE_UP_AFTER_SECONDS = 300;
const STEPS = ["Request access", "Patient approves", "View record"];

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function classify(err) {
  const message = err?.message || "";
  if (err?.status === 403 || /consent|permission/i.test(message)) return "needs_consent";
  if (err?.status === 404 || /not found/i.test(message)) return "not_found";
  return null;
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function ConsentPage() {
  const router = useRouter();
  const params = useParams();
  const uid = safeDecode(String(params.systemUid || ""));

  const [phase, setPhase] = useState("checking");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);

  const checkAccess = useCallback(async () => {
    try {
      await getDoctorPatientRecord(uid);
      return "granted";
    } catch (err) {
      const kind = classify(err);
      if (kind) return kind;
      throw err;
    }
  }, [uid]);

  const runCheck = useCallback(() => {
    setError("");
    setPhase("checking");
    checkAccess()
      .then(setPhase)
      .catch((err) => {
        setError(err.message);
        setPhase("error");
      });
  }, [checkAccess]);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  async function handleRequest() {
    setError("");
    setPhase("requesting");
    try {
      await requestPatientConsent(uid);
      setElapsed(0);
      setPhase("waiting");
    } catch (err) {
      setError(err.message);
      setPhase("needs_consent");
    }
  }

  // While waiting: count seconds
  useEffect(() => {
    if (phase !== "waiting") return;
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // While waiting: check whether the patient has approved
  useEffect(() => {
    if (phase !== "waiting") return;
    if (elapsed >= GIVE_UP_AFTER_SECONDS) {
      setPhase("timeout");
      return;
    }
    if (elapsed === 0 || elapsed % POLL_EVERY_SECONDS !== 0) return;
    checkAccess()
      .then((result) => {
        if (result === "granted") setPhase("granted");
      })
      .catch(() => {});
  }, [phase, elapsed, checkAccess]);

  const current =
    phase === "granted" ? 4 : phase === "waiting" || phase === "timeout" ? 2 : phase === "needs_consent" || phase === "requesting" ? 1 : 0;

  return (
    <div className={styles.page}>
      <button type="button" onClick={() => router.back()} className={styles.back}>
        ← Back to scan
      </button>
      <h1 className={styles.title}>Patient consent</h1>
      <p className={styles.subtitle}>
        Patients decide who can see their record. Send a request and the patient approves it on their own phone.
      </p>

      <section className={styles.card}>
        <div className={styles.patientRow}>
          <div className={styles.avatar}>{(uid || "?").slice(0, 2).toUpperCase()}</div>
          <div>
            <p className={styles.label}>Uzima Link ID</p>
            <p className={styles.uid}>{uid}</p>
          </div>
        </div>

        <ol className={styles.steps}>
          {STEPS.map((label, i) => {
            const n = i + 1;
            const state = current === 4 || n < current ? "done" : n === current ? "active" : "todo";
            return (
              <li key={label} className={`${styles.step} ${styles[state]}`}>
                <span className={styles.stepDot}>{state === "done" ? "✓" : n}</span>
                <span className={styles.stepLabel}>{label}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={styles.card}>
        {phase === "checking" && <p className={styles.muted}>Checking access...</p>}

        {phase === "not_found" && (
          <>
            <h2 className={styles.panelTitle}>Patient not found</h2>
            <p className={styles.text}>No patient matches this ID. Check the ID, or scan the card again.</p>
            <button type="button" onClick={() => router.back()} className={styles.primaryButton}>
              Try again
            </button>
          </>
        )}

        {(phase === "needs_consent" || phase === "requesting") && (
          <>
            <h2 className={styles.panelTitle}>Consent required</h2>
            <p className={styles.text}>
              This patient has not given you access to their record yet. Send a request to their Uzima Link app. They
              will see a prompt asking them to approve or deny it.
            </p>
            {error && <p className={styles.error}>{error}</p>}
            <button
              type="button"
              onClick={handleRequest}
              disabled={phase === "requesting"}
              className={styles.primaryButton}
            >
              {phase === "requesting" ? "Sending request..." : "Request consent from patient"}
            </button>
          </>
        )}

        {phase === "waiting" && (
          <>
            <div className={styles.waitingRow}>
              <span className={styles.pulse} />
              <h2 className={styles.panelTitle}>Waiting for the patient to respond</h2>
              <span className={styles.timer}>{formatTime(elapsed)}</span>
            </div>
            <p className={styles.text}>
              Ask the patient to open Uzima Link and tap <strong>I consent</strong>. The prompt appears on their screen
              within a few seconds. This page updates by itself.
            </p>
            {elapsed >= 60 && (
              <p className={styles.hint}>
                Still waiting. Make sure the patient has the app open, or ask them to check the Consent page in their menu.
              </p>
            )}
            <button type="button" onClick={() => router.back()} className={styles.secondaryButton}>
              Cancel
            </button>
          </>
        )}

        {phase === "timeout" && (
          <>
            <h2 className={styles.panelTitle}>No response yet</h2>
            <p className={styles.text}>
              The patient has not approved the request. They may not have seen it, or they may have denied it.
            </p>
            <div className={styles.buttonRow}>
              <button type="button" onClick={handleRequest} className={styles.primaryButton}>
                Send request again
              </button>
              <button type="button" onClick={() => router.back()} className={styles.secondaryButton}>
                Back
              </button>
            </div>
          </>
        )}

        {phase === "granted" && (
          <>
            <h2 className={`${styles.panelTitle} ${styles.okTitle}`}>Access granted</h2>
            <p className={styles.text}>The patient has consented. You can now view their record.</p>
            <button type="button" onClick={() => router.push(recordPath(uid))} className={styles.primaryButton}>
              Open patient record
            </button>
          </>
        )}

        {phase === "error" && (
          <>
            <h2 className={styles.panelTitle}>Something went wrong</h2>
            <p className={styles.error}>{error || "Could not check access."}</p>
            <div className={styles.buttonRow}>
              <button type="button" onClick={runCheck} className={styles.primaryButton}>
                Try again
              </button>
              <button type="button" onClick={() => router.back()} className={styles.secondaryButton}>
                Back
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}