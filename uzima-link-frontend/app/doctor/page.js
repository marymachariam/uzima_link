"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDoctorProfile, getDoctorQueue } from "@/lib/endpoints";
import styles from "./page.module.css";

export default function DoctorDashboard() {
  const [profile, setProfile] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setCurrentTime(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    );

    Promise.all([getDoctorProfile(), getDoctorQueue().catch(() => [])])
      .then(([p, q]) => {
        setProfile(p);
        setQueue(q);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Loading your clinical workspace...</p>
      </div>
    );
  }

  const waiting = queue.filter((q) => q.status === "waiting");
  const inProgress = queue.filter((q) => q.status === "in_progress");
  const facility = profile?.facility;

  return (
    <div className={styles.dashboardWrapper}>
      {/* Hero Welcome Banner */}
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <div className={styles.dateBadge}>📅 {currentTime}</div>
          <h1 className={styles.greeting}>
            Good day, Dr. {profile?.full_name?.split(" ")[0] || "Doctor"}
          </h1>
          <p className={styles.subtitle}>
            <span>🏥 {facility?.name || "Watamu Hospital"}</span>
            <span className={styles.dotDivider}>•</span>
            <span>📍 {facility?.county || "County Facility"}</span>
          </p>
        </div>
        <div className={styles.heroStatusWrapper}>
          <div className={profile?.kyc_verified ? styles.badgeGood : styles.badgeBad}>
            {profile?.kyc_verified ? "✓ Verified Practitioner" : "⚠ Pending Verification"}
          </div>
          <span className={styles.dutyStatus}>● On Duty & Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <StatCard
          icon="👥"
          label="Patients Waiting"
          value={waiting.length}
          href="/doctor/queue"
          tone="waiting"
          description="In queue for consultation"
        />
        <StatCard
          icon="⚡"
          label="In Progress"
          value={inProgress.length}
          href="/doctor/queue"
          tone="progress"
          description="Currently being examined"
        />
        <StatCard
          icon="🏢"
          label="Facility County"
          value={facility?.county || "Kenya"}
          isText
          description="Assigned region jurisdiction"
        />
      </div>

      {/* Main Content Split Grid */}
      <div className={styles.contentGrid}>
        {/* Left Column: Live Queue Preview */}
        <div className={styles.column}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Live Patient Queue</h2>
            <Link href="/doctor/queue" className={styles.seeAllLink}>
              View all →
            </Link>
          </div>

          <div className={styles.queueCard}>
            {waiting.length === 0 && inProgress.length === 0 ? (
              <div className={styles.emptyQueue}>
                <span className={styles.emptyIcon}>🎉</span>
                <p className={styles.emptyText}>Queue is completely clear!</p>
                <span className={styles.emptySubtext}>No patients are currently waiting at your facility.</span>
              </div>
            ) : (
              <div className={styles.queueList}>
                {waiting.slice(0, 4).map((entry, index) => (
                  <Link
                    key={entry.id || index}
                    href={entry.patient_system_uid ? `/doctor/scan/${entry.patient_system_uid}` : "/doctor/queue"}
                    className={styles.queueRow}
                  >
                    <div className={styles.queuePatientInfo}>
                      <span className={styles.queueAvatar}>👤</span>
                      <div>
                        <span className={styles.queueName}>{entry.patient_name || "Unknown patient"}</span>
                        <span className={styles.queueId}>ID: {entry.patient_system_uid?.slice(0, 8) || "Standard"}</span>
                      </div>
                    </div>
                    <div className={styles.queueMeta}>
                      <span className={styles.queueTime}>
                        {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={styles.queueBadge}>Waiting</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {waiting.length > 4 && (
              <Link href="/doctor/queue" className={styles.queueMore}>
                +{waiting.length - 4} more patients waiting in queue →
              </Link>
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions & Clinical Tools */}
        <div className={styles.column}>
          <h2 className={styles.sectionTitle}>Clinical Actions</h2>
          <div className={styles.actionsGrid}>
            <ActionCard
              href="/doctor/scan"
              icon="🔍"
              title="Scan Patient Health Card"
              description="Look up complete medical records via QR code or manual ID."
              color="#0d9488"
            />
            <ActionCard
              href="/doctor/queue"
              icon="📋"
              title="Manage Facility Queue"
              description="Monitor active consultations, triage status, and patient flow."
              color="#2563eb"
            />
            <ActionCard
              href="/doctor/profile"
              icon="⚙️"
              title="Doctor Profile & Settings"
              description="Update medical credentials, profile photo, and specialty tags."
              color="#7c3aed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, href, tone, isText, description }) {
  const content = (
    <div className={styles.statCardInner}>
      <div className={styles.statHeaderRow}>
        <span className={styles.statIconBadge}>{icon}</span>
        <span className={styles.statLabel}>{label}</span>
      </div>
      <div className={styles.statDataRow}>
        <span className={isText ? styles.statValueText : `${styles.statValue} ${tone ? styles[`tone_${tone}`] : ""}`}>
          {value}
        </span>
      </div>
      <span className={styles.statDesc}>{description}</span>
    </div>
  );

  return href ? (
    <Link href={href} className={styles.statCardLink}>{content}</Link>
  ) : (
    <div className={styles.statCard}>{content}</div>
  );
}

function ActionCard({ href, icon, title, description, color }) {
  return (
    <Link href={href} className={styles.actionCard}>
      <div className={styles.actionIconWrapper} style={{ backgroundColor: `${color}15`, color: color }}>
        {icon}
      </div>
      <div className={styles.actionTextContent}>
        <h3 className={styles.actionTitle}>{title}</h3>
        <p className={styles.actionDescription}>{description}</p>
      </div>
      <span className={styles.actionArrow}>→</span>
    </Link>
  );
}