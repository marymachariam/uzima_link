"use client";

import { useEffect, useRef, useState } from "react";
import { getPatientProfile, updatePatientProfile, uploadPatientPhoto } from "@/lib/endpoints";
import styles from "./page.module.css";

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
        full_name: profile.full_name, // unchanged: name comes from the verified ID
        phone_number: phone,
        guardian_name: form.guardian_name.trim(),
        guardian_phone: form.guardian_phone.trim(),
      });
      const fresh = await getPatientProfile();
      setProfile(fresh);
      setForm(toForm(fresh));
      setSuccess(true);
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
      setPhotoError("Please choose an image file.");
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
      // clipboard not available; ignore
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Your profile</h1>
        <p className={styles.subtitle}>Loading your profile...</p>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Your profile</h1>
        <p className={styles.error}>{loadError || "Could not load your profile."}</p>
        <button type="button" onClick={loadProfile} className={styles.primaryButton}>
          Try again
        </button>
      </div>
    );
  }

  const age = getAge(profile.date_of_birth);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Your profile</h1>
      <p className={styles.subtitle}>Manage your personal details and who we contact on your behalf.</p>

      <section className={`${styles.card} ${styles.hero}`}>
        <div className={styles.avatarWrap}>
          {profile.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photo_url} alt="Your profile" className={styles.avatar} />
          ) : (
            <div className={styles.avatarFallback}>{getInitials(profile.full_name)}</div>
          )}
        </div>

        <div className={styles.heroInfo}>
          <h2 className={styles.name}>
            {profile.full_name}
            <span className={`${styles.badge} ${profile.kyc_verified ? "" : styles.badgeWarn}`}>
              {profile.kyc_verified ? "Identity verified" : "Not verified"}
            </span>
          </h2>
          {profile.created_at && <p className={styles.meta}>Member since {formatMonthYear(profile.created_at)}</p>}

          <div className={styles.idRow}>
            <span className={styles.idLabel}>Uzima Link ID</span>
            <span className={styles.idValue}>{profile.system_uid}</span>
            <button type="button" onClick={copyId} className={styles.linkButton}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className={styles.idRow}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className={styles.linkButton}
            >
              {uploading ? "Uploading..." : "Change photo"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} hidden />
          </div>
          {photoError && <p className={styles.error}>{photoError}</p>}
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Personal details</h3>
        <div className={styles.grid}>
          <div className={styles.field}>
            <span className={styles.label}>Full name</span>
            <span className={styles.value}>{profile.full_name}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Date of birth</span>
            <span className={styles.value}>
              {formatDate(profile.date_of_birth)}
              {age !== null ? ` (${age} years)` : ""}
            </span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Gender</span>
            <span className={styles.value}>{prettify(profile.gender)}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>{prettify(profile.id_type)}</span>
            <span className={styles.value}>{maskId(profile.national_id)}</span>
          </div>
        </div>
        <p className={styles.hint}>These details come from your verified ID, so they can&apos;t be edited here.</p>
      </section>

      <form onSubmit={handleSave} className={styles.card}>
        <h3 className={styles.cardTitle}>Contact and guardian</h3>
        <div className={styles.grid}>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label htmlFor="phone" className={styles.label}>Phone number</label>
            <input
              id="phone"
              type="tel"
              value={form.phone_number}
              onChange={(e) => updateField("phone_number", e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="guardianName" className={styles.label}>Guardian or emergency contact</label>
            <input
              id="guardianName"
              value={form.guardian_name}
              onChange={(e) => updateField("guardian_name", e.target.value)}
              placeholder="Name"
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="guardianPhone" className={styles.label}>Guardian phone</label>
            <input
              id="guardianPhone"
              type="tel"
              value={form.guardian_phone}
              onChange={(e) => updateField("guardian_phone", e.target.value)}
              placeholder="+254..."
              className={styles.input}
            />
          </div>
        </div>

        {saveError && <p className={styles.error}>{saveError}</p>}

        <div className={styles.actions}>
          <button type="submit" disabled={saving || !hasChanges} className={styles.primaryButton}>
            {saving ? "Saving..." : "Save changes"}
          </button>
          {success && <span className={styles.success}>Profile updated</span>}
        </div>
      </form>
    </div>
  );
}