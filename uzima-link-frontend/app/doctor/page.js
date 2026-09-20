"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDoctorProfile, getDoctorQueue } from "@/lib/endpoints";
import styles from "./page.module.css";

export default function DoctorDashboard() {
  const [profile, setProfile] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDoctorProfile(), getDoctorQueue().catch(() => [])])
      .then(([p, q]) => {
        setProfile(p);
        setQueue(q);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className={styles.loadingText}>Loading...</p>;

  const waiting = queue.filter((q) => q.status === "waiting");
  const inProgress = queue.filter((q) => q.status === "in_progress");
  const facility = profile?.facility;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Good day, Dr. {profile?.full_name?.split(" ")[0]}</h1>
          <p className={styles.subtitle}>{facility?.name || "No facility linked"}</p>
        </div>
        <span className={profile?.kyc_verified ? styles.badgeGood : styles.badgeBad}>
          {profile?.kyc_verified ? "✓ Verified" : "Pending verification"}
        </span>
      </div>

      <div className={styles.statsGrid}>
        <StatCard label="Waiting" value={waiting.length} href="/doctor/queue" tone="waiting" />
        <StatCard label="In progress" value={inProgress.length} href="/doctor/queue" tone="progress" />
        <StatCard label="Facility county" value={facility?.county || "—"} isText />
      </div>

      {waiting.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Next up</h2>
          <div className={styles.queuePreview}>
            {waiting.slice(0, 3).map((entry) => (
              <Link
                key={entry.id}
                href={entry.patient_system_uid ? `/doctor/scan/${entry.patient_system_uid}` : "/doctor/queue"}
                className={styles.queueRow}
              >
                <span className={styles.queueName}>{entry.patient_name || "Unknown patient"}</span>
                <span className={styles.queueTime}>{new Date(entry.created_at).toLocaleTimeString()}</span>
              </Link>
            ))}
            {waiting.length > 3 && (
              <Link href="/doctor/queue" className={styles.queueMore}>
                +{waiting.length - 3} more in queue →
              </Link>
            )}
          </div>
        </>
      )}

      <h2 className={styles.sectionTitle}>Quick actions</h2>
      <div className={styles.actionsGrid}>
        <ActionCard href="/doctor/scan" title="Scan a patient" description="Look up a patient's health record" />
        <ActionCard href="/doctor/queue" title="View full queue" description="See everyone waiting at your facility" />
        <ActionCard href="/doctor/profile" title="Update your profile" description="Photo, specialty, facility details" />
      </div>
    </div>
  );
}

function StatCard({ label, value, href, tone, isText }) {
  const content = (
    <>
      <span className={isText ? styles.statValueText : `${styles.statValue} ${tone ? styles[`tone_${tone}`] : ""}`}>
        {value}
      </span>
      <span className={styles.statLabel}>{label}</span>
    </>
  );
  return href ? (
    <Link href={href} className={styles.statCard}>{content}</Link>
  ) : (
    <div className={styles.statCard}>{content}</div>
  );
}

function ActionCard({ href, title, description }) {
  return (
    <Link href={href} className={styles.actionCard}>
      <h3 className={styles.actionTitle}>{title}</h3>
      <p className={styles.actionDescription}>{description}</p>
    </Link>
  );
}