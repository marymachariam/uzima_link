"use client";

import { useEffect, useRef, useState } from "react";
import { getDoctorProfile, updateDoctorProfile, uploadDoctorPhoto } from "@/lib/endpoints";
import styles from "./page.module.css";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const SPECIALTIES = [
  "General practitioner",
  "Clinical officer",
  "Internal medicine",
  "Paediatrics",
  "Obstetrics and gynaecology",
  "General surgery",
  "Orthopaedics",
  "Emergency medicine",
  "Psychiatry",
  "Dermatology",
  "Ophthalmology",
  "ENT",
  "Radiology",
  "Dentistry",
];

function formatMonthYear(value) {
  if (!value) return "Not provided";
  const d = new Date(value);
  if (isNaN(d)) return "Not provided";
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function prettify(value) {
  if (!value) return "Not provided";
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function stripTitle(name) {
  return (name || "").replace(/^dr\.?\s+/i, "").trim();
}

function getInitials(name) {
  const initials = stripTitle(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join("");
  return initials || "Dr";
}

function getChecklist(p) {
  return [
    { label: "Add a profile photo", done: !!p.photo_url },
    { label: "Add your specialty", done: !!(p.specialty && p.specialty.trim()) },
    { label: "Verify your email", done: !!p.is_verified },
    { label: "Complete identity verification", done: !!p.kyc_verified },
  ];
}

function Field({ label, value }) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value || "Not provided"}</span>
    </div>
  );
}

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState(null);
  const [specialty, setSpecialty] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const fileRef = useRef(null);

  function loadProfile() {
    setLoading(true);
    setLoadError("");
    getDoctorProfile()
      .then((p) => {
        setProfile(p);
        setSpecialty(p.specialty || "");
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const hasChanges = profile && specialty.trim() !== (profile.specialty || "").trim();

  async function handleSave(e) {
    e.preventDefault();
    setSaveError("");
    setSuccess(false);
    if (!specialty.trim()) {
      setSaveError("Please enter your specialty.");
      return;
    }
    setSaving(true);
    try {
      await updateDoctorProfile({ specialty: specialty.trim() });
      const fresh = await getDoctorProfile();
      setProfile(fresh);
      setSpecialty(fresh.specialty || "");
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
      const updated = await uploadDoctorPhoto(formData);
      setProfile((p) => ({ ...p, photo_url: updated?.photo_url ?? p.photo_url }));
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setUploading(false);
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

  const facility = profile.facility;
  const checklist = getChecklist(profile);
  const doneCount = checklist.filter((c) => c.done).length;
  const percent = Math.round((doneCount / checklist.length) * 100);
  const displayName = stripTitle(profile.full_name) ? `Dr. ${stripTitle(profile.full_name)}` : "Doctor";

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Your profile</h1>
      <p className={styles.subtitle}>How patients and colleagues see you on Uzima Link.</p>

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
          <h2 className={styles.name}>{displayName}</h2>
          <p className={styles.meta}>{profile.specialty || "Specialty not set"}</p>
          {facility?.name && <p className={styles.meta}>{facility.name}</p>}

          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${profile.kyc_verified ? "" : styles.badgeWarn}`}>
              {profile.kyc_verified ? "Identity verified" : "Identity pending"}
            </span>
            <span className={`${styles.badge} ${profile.is_verified ? "" : styles.badgeWarn}`}>
              {profile.is_verified ? "Email verified" : "Email not verified"}
            </span>
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

      {percent < 100 && (
        <section className={styles.card}>
          <div className={styles.progressHeader}>
            <h3 className={styles.cardTitle}>Profile strength</h3>
            <span className={styles.percent}>{percent}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressBar} style={{ width: `${percent}%` }} />
          </div>
          <ul className={styles.checklist}>
            {checklist.map((c) => (
              <li key={c.label} className={c.done ? styles.checkDone : styles.checkTodo}>
                {c.done ? "✓" : "○"} {c.label}
              </li>
            ))}
          </ul>
        </section>
      )}

      <form onSubmit={handleSave} className={styles.card}>
        <h3 className={styles.cardTitle}>Professional details</h3>
        <div className={styles.field}>
          <label htmlFor="specialty" className={styles.label}>Specialty</label>
          <input
            id="specialty"
            list="specialties"
            value={specialty}
            onChange={(e) => {
              setSpecialty(e.target.value);
              setSuccess(false);
            }}
            placeholder="e.g. Paediatrics"
            className={styles.input}
          />
          <datalist id="specialties">
            {SPECIALTIES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        {saveError && <p className={styles.error}>{saveError}</p>}

        <div className={styles.actions}>
          <button type="submit" disabled={saving || !hasChanges} className={styles.primaryButton}>
            {saving ? "Saving..." : "Save changes"}
          </button>
          {success && <span className={styles.success}>Profile updated</span>}
        </div>
      </form>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Facility</h3>
        {facility ? (
          <>
            <p className={styles.facilityName}>{facility.name}</p>
            <div className={styles.grid}>
              <Field label="Facility type" value={prettify(facility.facility_type)} />
              <Field label="KMHFR code" value={facility.kmhfr_code} />
              <Field label="County" value={facility.county} />
              <Field label="Sub-county" value={facility.sub_county} />
            </div>
          </>
        ) : (
          <p className={styles.hint}>No facility is linked to your account yet.</p>
        )}
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Account</h3>
        <div className={styles.grid}>
          <Field label="Email" value={profile.email} />
          <Field label="Member since" value={formatMonthYear(profile.created_at)} />
          <Field label="Email status" value={profile.is_verified ? "Verified" : "Not verified"} />
          <Field label="Identity verification" value={profile.kyc_verified ? "Verified" : "Pending review"} />
        </div>
        <p className={styles.hint}>Your name, email and facility come from your registration and verified ID.</p>
      </section>
    </div>
  );
}