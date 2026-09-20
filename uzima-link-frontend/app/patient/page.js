"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getPatientProfile,
  getSymptomHistory,
  getAllergies,
  getPrescriptions,
  getConsentRequests,
} from "@/lib/endpoints";
import styles from "./page.module.css";

export default function PatientDashboard() {
  const [profile, setProfile] = useState(null);
  const [symptomCount, setSymptomCount] = useState(0);
  const [allergyCount, setAllergyCount] = useState(0);
  const [prescriptionCount, setPrescriptionCount] = useState(0);
  const [pendingConsent, setPendingConsent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPatientProfile(),
      getSymptomHistory().catch(() => []),
      getAllergies().catch(() => []),
      getPrescriptions().catch(() => []),
      getConsentRequests().catch(() => []),
    ])
      .then(([p, symptoms, allergies, prescriptions, consent]) => {
        setProfile(p);
        setSymptomCount(symptoms.length);
        setAllergyCount(allergies.length);
        setPrescriptionCount(prescriptions.length);
        setPendingConsent(consent.length);
      })
      .finally(() => setLoading(false));
  }, []);

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Hi, {firstName}</h1>
          <p className={styles.subtitle}>Here&apos;s a quick look at your health record.</p>
        </div>
        <span className={styles.verifiedBadge}>✓ Verified</span>
      </div>

      {loading ? (
        <p className={styles.loadingText}>Loading your dashboard...</p>
      ) : (
        <>
          {pendingConsent > 0 && (
            <Link href="/patient/consent" className={styles.alertBanner}>
              A facility is requesting access to your record ({pendingConsent} pending) — review now
            </Link>
          )}

          <div className={styles.statsGrid}>
            <StatCard label="Symptom entries" value={symptomCount} href="/patient/symptoms" />
            <StatCard label="Allergies on file" value={allergyCount} href="/patient/allergies" />
            <StatCard label="Prescriptions" value={prescriptionCount} href="/patient/prescriptions" />
          </div>

          <h2 className={styles.sectionTitle}>Quick actions</h2>
          <div className={styles.actionsGrid}>
            <ActionCard href="/patient/symptoms" title="Log how you're feeling" description="Text or voice, in your own language" />
            <ActionCard href="/patient/medicine" title="Check a medicine" description="See if it's genuine before you take it" />
            <ActionCard href="/patient/health-card" title="Download your health card" description="Share it with any doctor" />
            <ActionCard href="/patient/profile" title="Update your profile" description="Photo, contact details" />
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, href }) {
  return (
    <Link href={href} className={styles.statCard}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </Link>
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