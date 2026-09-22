"use client";

import { useEffect, useRef, useState } from "react";
import { getPatientProfile, updatePatientProfile, uploadPatientPhoto } from "@/lib/endpoints";
import styles from "./page.module.css";
import { 
  User, 
  ShieldCheck, 
  ShieldAlert, 
  Phone, 
  Calendar, 
  FileText, 
  Camera, 
  Copy, 
  Check, 
  Sparkles,
  Lock,
  Users,
  AlertCircle
} from "lucide-react";

const PHONE_PATTERN = /^\+?[0-9\s-]{9,15}$/;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function formatDate(value) {
  if (!value) return "Not provided";
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function formatMonthYear(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function getAge(value) {
  const d = new Date(value);
  if (!value || isNaN(d)) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age--;
  return age;
}

function prettify(value) {
  if (!value) return "Not provided";
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function maskId(value) {
  if (!value) return "Not provided";
  return "•".repeat(Math.max(value.length - 3, 0)) + value.slice(-3);
}

function getInitials(name) {
  const initials = (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join("");
  return initials || "?";
}

function toForm(p) {
  return {
    phone_number: p.phone_number || "",
    guardian_name: p.guardian_name || "",
    guardian_phone: p.guardian_phone || "",
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ phone_number: "", guardian_name: "", guardian_phone: "" });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);

  function loadProfile() {
    setLoading(true);
    setLoadError("");
    getPatientProfile()
      .then((p) => {
        setProfile(p);
        setForm(toForm(p));
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const hasChanges =
    profile && Object.keys(form).some((k) => form[k].trim() !== (profile[k] || "").trim());

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setSuccess(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveError("");
    setSuccess(false);

    const phone = form.phone_number.trim();
    if (!PHONE_PATTERN.test(phone)) {
      setSaveError("Enter a valid phone number, for example +254712345678.");
      return;
    }

    setSaving(true);
    try {
      await updatePatientProfile({
        full_name: profile.full_name,
        phone_number: phone,
        guardian_name: form.guardian_name.trim(),
        guardian_phone: form.guardian_phone.trim(),
      });
      const fresh = await getPatientProfile();
      setProfile(fresh);
      setForm(toForm(fresh));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError("");
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose a valid image file.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("The image must be smaller than 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const updated = await uploadPatientPhoto(formData);
      setProfile((p) => ({ ...p, photo_url: updated?.photo_url ?? p.photo_url }));
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function copyId() {
    try {
      await navigator.clipboard.writeText(profile.system_uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.subtitle}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className={styles.page}>
        <div className={styles.errorCard}>
          <AlertCircle size={28} color="#dc2626" />
          <h3>Could not load profile</h3>
          <p className={styles.error}>{loadError || "An unexpected error occurred."}</p>
          <button type="button" onClick={loadProfile} className={styles.primaryButton}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const age = getAge(profile.date_of_birth);

  return (
    <div className={styles.page}>
      {/* Header Banner */}
      <div className={styles.header}>
        <div className={styles.headerBadge}>
          <Sparkles size={14} /> Patient Account
        </div>
        <h1 className={styles.title}>Personal Profile</h1>
        <p className={styles.subtitle}>Manage your verified identity, emergency contacts, and account preferences.</p>
      </div>

      {/* Hero Profile Card */}
      <section className={styles.heroCard}>
        <div className={styles.avatarContainer}>
          {profile.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photo_url} alt="Profile" className={styles.avatar} />
          ) : (
            <div className={styles.avatarFallback}>{getInitials(profile.full_name)}</div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={styles.avatarUploadBtn}
            title="Change photo"
          >
            <Camera size={14} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} hidden />
        </div>

        <div className={styles.heroDetails}>
          <div className={styles.heroNameRow}>
            <h2 className={styles.name}>{profile.full_name}</h2>
            <span className={`${styles.verificationBadge} ${profile.kyc_verified ? styles.verified : styles.unverified}`}>
              {profile.kyc_verified ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
              {profile.kyc_verified ? "Verified Identity" : "Unverified"}
            </span>
          </div>

          {profile.created_at && (
            <p className={styles.metaText}>Member since {formatMonthYear(profile.created_at)}</p>
          )}

          <div className={styles.idChipRow}>
            <div className={styles.idChip}>
              <span className={styles.chipLabel}>Uzima ID:</span>
              <span className={styles.chipValue}>{profile.system_uid}</span>
              <button type="button" onClick={copyId} className={styles.copyButton} title="Copy ID">
                {copied ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
          {photoError && <p className={styles.inlineError}>{photoError}</p>}
        </div>
      </section>

      {/* Verified ID Details Section */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIconWrap}>
            <FileText size={18} />
          </div>
          <div>
            <h3 className={styles.cardTitle}>Verified Government Details</h3>
            <p className={styles.cardDesc}>Pulled directly from your official ID records</p>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.fieldItem}>
            <span className={styles.fieldLabel}>Full Legal Name</span>
            <span className={styles.fieldValue}>{profile.full_name}</span>
          </div>

          <div className={styles.fieldItem}>
            <span className={styles.fieldLabel}>Date of Birth</span>
            <span className={styles.fieldValue}>
              {formatDate(profile.date_of_birth)} {age !== null && <span className={styles.subInfo}>({age} yrs)</span>}
            </span>
          </div>

          <div className={styles.fieldItem}>
            <span className={styles.fieldLabel}>Gender</span>
            <span className={styles.fieldValue}>{prettify(profile.gender)}</span>
          </div>

          <div className={styles.fieldItem}>
            <span className={styles.fieldLabel}>{prettify(profile.id_type) || "National ID"}</span>
            <span className={styles.fieldValue}>{maskId(profile.national_id)}</span>
          </div>
        </div>

        <div className={styles.noticeBox}>
          <Lock size={14} />
          <span>These core identifiers are locked for medical security and compliance.</span>
        </div>
      </section>

      {/* Editable Contact & Guardian Form */}
      <form onSubmit={handleSave} className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIconWrap}>
            <Users size={18} />
          </div>
          <div>
            <h3 className={styles.cardTitle}>Contact & Emergency Information</h3>
            <p className={styles.cardDesc}>Update how your care team and clinics reach you</p>
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={`${styles.fieldGroup} ${styles.fullSpan}`}>
            <label htmlFor="phone" className={styles.inputLabel}>Phone Number</label>
            <div className={styles.inputWrapper}>
              <Phone size={16} className={styles.inputIcon} />
              <input
                id="phone"
                type="tel"
                value={form.phone_number}
                onChange={(e) => updateField("phone_number", e.target.value)}
                className={styles.input}
                placeholder="+254 712 345 678"
                required
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="guardianName" className={styles.inputLabel}>Guardian / Emergency Contact</label>
            <input
              id="guardianName"
              value={form.guardian_name}
              onChange={(e) => updateField("guardian_name", e.target.value)}
              placeholder="Full name of contact"
              className={styles.inputPlain}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="guardianPhone" className={styles.inputLabel}>Emergency Phone Number</label>
            <input
              id="guardianPhone"
              type="tel"
              value={form.guardian_phone}
              onChange={(e) => updateField("guardian_phone", e.target.value)}
              placeholder="+254..."
              className={styles.inputPlain}
            />
          </div>
        </div>

        {saveError && (
          <div className={styles.errorBox}>
            <AlertCircle size={16} />
            <span>{saveError}</span>
          </div>
        )}

        <div className={styles.formFooter}>
          <button 
            type="submit" 
            disabled={saving || !hasChanges} 
            className={styles.primaryButton}
          >
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
          
          {success && (
            <div className={styles.successMessage}>
              <Check size={16} /> Profile updated successfully
            </div>
          )}
        </div>
      </form>
    </div>
  );
}