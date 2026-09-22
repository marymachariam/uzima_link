"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFrontdeskProfile, getFrontdeskQueue } from "@/lib/endpoints";
import styles from "./page.module.css";

export default function KioskDashboard() {
  const [profile, setProfile] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getFrontdeskProfile(), getFrontdeskQueue().catch(() => [])])
      .then(([p, q]) => {
        setProfile(p);
        setQueue(q);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading frontdesk portal...</p>
      </div>
    );
  }

  const waiting = queue.filter((q) => q.status === "waiting");
  const inProgress = queue.filter((q) => q.status === "in_progress");
  const facility = profile?.facility;
  const firstName = profile?.full_name?.split(" ")[0] || "Staff";

  return (
    <div className={styles.dashboardContainer}>
      {/* Hero Greeting Banner */}
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <div>
            <div className={styles.heroBadge}>
              <span className={styles.pulseDot}></span>
              Active Desk Session
            </div>
            <h1 className={styles.heroTitle}>
              Welcome back, {firstName} 👋
            </h1>
            <p className={styles.heroSubtitle}>
              {facility?.name ? `Managing operations at ${facility.name}` : "No facility linked — please check your profile setup"}
            </p>
          </div>
          <div className={styles.facilityInfoBox}>
            <span className={styles.facilityInfoLabel}>Facility County</span>
            <span className={styles.facilityInfoValue}>{facility?.county || "Unassigned"}</span>
          </div>
        </div>
      </div>

      {/* Queue Overview Section */}
      <div className={styles.sectionBlock}>
        <h2 className={styles.categoryTitle}>Queue Overview</h2>
        <div className={styles.statsGrid}>
          <StatCard
            label="Patients Waiting"
            value={waiting.length}
            href="/frontdesk/queue"
            tone="waiting"
            icon="⏳"
            description="Awaiting triage or consultation"
          />
          <StatCard
            label="In Progress"
            value={inProgress.length}
            href="/frontdesk/queue"
            tone="progress"
            icon="🩺"
            description="Currently with a clinician"
          />
          <StatCard
            label="Facility County"
            value={facility?.county || "—"}
            isText
            icon="📍"
            description="Registered regional station"
          />
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className={styles.sectionBlock}>
        <div className={styles.sectionHeaderRow}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <span className={styles.sectionNote}>Frequent frontdesk workflows</span>
        </div>
        <div className={styles.actionsGrid}>
          <ActionCard
            href="/frontdesk/patients"
            title="Register or Check-in"
            description="Search existing patient records or register a new walk-in arrival."
            icon="👤"
            badge="Primary"
          />
          <ActionCard
            href="/frontdesk/queue"
            title="Live Facility Queue"
            description="Monitor everyone waiting and track patient status in real-time."
            icon="📋"
          />
          <ActionCard
            href="/frontdesk/profile"
            title="Staff Profile & Code"
            description="View your credentials, upload photo, and check facility invite code."
            icon="🛡️"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, href, tone, isText, icon, description }) {
  const content = (
    <div className={styles.statCardInner}>
      <div className={styles.statCardHeader}>
        <span className={styles.statIcon}>{icon}</span>
        <span
          className={
            isText
              ? styles.statValueText
              : `${styles.statValue} ${tone === "waiting" ? styles.toneWaiting : tone === "progress" ? styles.toneProgress : ""}`
          }
        >
          {value}
        </span>
      </div>
      <h3 className={styles.statCardTitle}>{label}</h3>
      <p className={styles.statCardDesc}>{description}</p>
    </div>
  );

  if (!href) return <div className={styles.statCard}>{content}</div>;
  return (
    <Link href={href} className={`${styles.statCard} ${styles.statCardLink}`}>
      {content}
    </Link>
  );
}

function ActionCard({ href, title, description, icon, badge }) {
  return (
    <Link href={href} className={styles.actionCard}>
      <div>
        <div className={styles.actionHeaderRow}>
          <div className={styles.actionIconBox}>{icon}</div>
          {badge && <span className={styles.actionBadge}>{badge}</span>}
        </div>
        <h3 className={styles.actionTitle}>{title}</h3>
        <p className={styles.actionDescription}>{description}</p>
      </div>
      <div className={styles.actionFooter}>
        <span>Open module</span>
        <span>→</span>
      </div>
    </Link>
  );
}