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
import { 
  Activity, 
  AlertTriangle, 
  FileText, 
  ShieldAlert, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Pill, 
  QrCode, 
  UserCog 
} from "lucide-react";

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
    <div className={styles.dashboardContainer}>
      {/* Top Header Section */}
      <div className={styles.header}>
        <div className={styles.greetingWrapper}>
          <div className={styles.welcomeBadge}>
            <Sparkles size={14} /> Patient Portal
          </div>
          <h1 className={styles.greeting}>Welcome back, {firstName} 👋</h1>
          <p className={styles.subtitle}>Here is a real-time overview of your unified health records.</p>
        </div>
        <div className={styles.verifiedBadge}>
          <CheckCircle2 size={16} /> Verified Account
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading your health dashboard...</p>
        </div>
      ) : (
        <>
          {/* Consent Alert Banner */}
          {pendingConsent > 0 && (
            <Link href="/patient/consent" className={styles.alertBanner}>
              <div className={styles.alertIconWrapper}>
                <ShieldAlert size={20} />
              </div>
              <div className={styles.alertContent}>
                <span className={styles.alertTitle}>Access Request Pending</span>
                <span className={styles.alertText}>A medical facility is requesting access to your record ({pendingConsent} pending) — Click to review.</span>
              </div>
              <ArrowRight size={18} className={styles.alertArrow} />
            </Link>
          )}

          {/* Key Metrics / Stats Grid */}
          <div className={styles.statsGrid}>
            <StatCard 
              label="Symptom Entries" 
              value={symptomCount} 
              href="/patient/symptoms" 
              icon={Activity} 
              colorTheme="emerald"
            />
            <StatCard 
              label="Allergies on File" 
              value={allergyCount} 
              href="/patient/allergies" 
              icon={AlertTriangle} 
              colorTheme="amber"
            />
            <StatCard 
              label="Active Prescriptions" 
              value={prescriptionCount} 
              href="/patient/prescriptions" 
              icon={FileText} 
              colorTheme="blue"
            />
          </div>

          {/* Quick Actions Grid */}
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Quick Actions</h2>
            <span className={styles.sectionSubtitle}>Frequently used tools</span>
          </div>

          <div className={styles.actionsGrid}>
            <ActionCard 
              href="/patient/symptoms" 
              title="Log how you're feeling" 
              description="Record symptoms easily via text or voice input in your preferred language."
              icon={Activity}
            />
            <ActionCard 
              href="/patient/medicine" 
              title="Check a medicine" 
              description="Verify authenticity and safety details before taking your medication."
              icon={Pill}
            />
            <ActionCard 
              href="/patient/health-card" 
              title="Download your health card" 
              description="Access your digital universal health card and share securely with any doctor."
              icon={QrCode}
            />
            <ActionCard 
              href="/patient/profile" 
              title="Update your profile" 
              description="Keep your personal information, profile photo, and emergency contacts up to date."
              icon={UserCog}
            />
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, href, icon: Icon, colorTheme }) {
  return (
    <Link href={href} className={`${styles.statCard} ${styles[colorTheme]}`}>
      <div className={styles.statCardTop}>
        <span className={styles.statValue}>{value}</span>
        <div className={styles.statIconBox}>
          <Icon size={22} />
        </div>
      </div>
      <span className={styles.statLabel}>{label}</span>
      <div className={styles.statCardFooter}>
        <span>View details</span>
        <ArrowRight size={14} />
      </div>
    </Link>
  );
}

function ActionCard({ href, title, description, icon: Icon }) {
  return (
    <Link href={href} className={styles.actionCard}>
      <div className={styles.actionCardHeader}>
        <div className={styles.actionIconBox}>
          <Icon size={20} />
        </div>
        <ArrowRight size={16} className={styles.actionArrow} />
      </div>
      <h3 className={styles.actionTitle}>{title}</h3>
      <p className={styles.actionDescription}>{description}</p>
    </Link>
  );
}