"use client";

import { useEffect, useRef, useState } from "react";
import { getDoctorProfile, updateDoctorProfile, uploadDoctorPhoto } from "@/lib/endpoints";
import styles from "./page.module.css";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHONE_PATTERN = /^\+?[0-9\s-]{9,15}$/;

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

// Editable fields. A field only appears once the API returns it.
const FIELDS = [
  { key: "specialty", label: "Specialty", section: "professional", placeholder: "e.g. Paediatrics", list: "specialties" },
  { key: "license_number", label: "Medical licence number", section: "professional", placeholder: "KMPDC registration number" },
  { key: "qualifications", label: "Qualifications", section: "professional", placeholder: "e.g. MBChB, MMed Radiology" },
  { key: "years_experience", label: "Years of experience", section: "professional", type: "number", placeholder: "e.g. 8" },
  { key: "languages", label: "Languages spoken", section: "professional", placeholder: "e.g. English, Swahili" },
  { key: "consultation_hours", label: "Consultation hours", section: "professional", placeholder: "e.g. Mon to Fri, 8am to 5pm", full: true },
  { key: "bio", label: "About you", section: "about", type: "textarea", placeholder: "A short introduction that patients and colleagues can read.", max: 600, full: true },
  { key: "phone_number", label: "Phone number", section: "contact", type: "tel", placeholder: "+254712345678" },
];

function has(profile, key) {
  return Object.prototype.hasOwnProperty.call(profile, key);
}

function norm(value) {
  return String(value ?? "").trim();
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatMonthYear(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function prettify(value) {
  if (!value) return "";
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function maskId(value) {
  if (!value) return "";
  return "•".repeat(Math.max(value.length - 3, 0)) + value.slice(-3);
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

function toForm(profile) {
  const form = {};
  FIELDS.forEach((f) => {
    if (has(profile, f.key)) form[f.key] = profile[f.key] == null ? "" : String(profile[f.key]);
  });
  return form;
}

function getChecklist(p) {
  const items = [
    { label: "Add a profile photo", done: !!p.photo_url },
    has(p, "specialty") && { label: "Add your specialty", done: !!norm(p.specialty) },
    has(p, "license_number") && { label: "Add your licence number", done: !!norm(p.license_number) },
    has(p, "bio") && { label: "Write a short bio", done: !!norm(p.bio) },
    has(p, "phone_number") && { label: "Add a phone number", done: !!norm(p.phone_number) },
    { label: "Verify your email", done: !!p.is_verified },
    { label: "Complete identity verification", done: !!p.kyc_verified },
  ];
  return items.filter(Boolean);
}

function Field({ label, value }) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value || "Not provided"}</span>
    </div>
  );
}

function FormField({ def, value, onChange }) {
  const id = `field-${def.key}`;
  return (
    <div className={`${styles.field} ${def.full ? styles.fieldFull : ""}`}>
      <label htmlFor={id} className={styles.label}>{def.label}</label>
      {def.type === "textarea" ? (
        <>
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(def.key, e.target.value)}
            placeholder={def.placeholder}
            maxLength={def.max}
            rows={4}
            className={`${styles.input} ${styles.textarea}`}
          />
          <span className={styles.counter}>{value.length}/{def.max}</span>
        </>
      ) : (
        <input
          id={id}
          type={def.type || "text"}
          min={def.type === "number" ? 0 : undefined}
          list={def.list}
          value={value}
          onChange={(e) => onChange(def.key, e.target.value)}
          placeholder={def.placeholder}
          className={styles.input}
        />
      )}
    </div>
  );
}

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
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
        setForm(toForm(p));
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const activeFields = profile ? FIELDS.filter((f) => has(profile, f.key)) : [];
  const changed = activeFields.filter((f) => norm(form[f.key]) !== norm(profile[f.key]));
  const hasChanges = changed.length > 0;

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setSuccess(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveError("");
    setSuccess(false);
    if (!hasChanges) return;

    for (const f of changed) {
      const v = norm(form[f.key]);
      if (f.key === "specialty" && !v) {
        setSaveError("Please enter your specialty.");
        return;
      }
      if (f.key === "phone_number" && !PHONE_PATTERN.test(v)) {
        setSaveError("Enter a valid phone number, for example +254712345678.");
        return;
      }
      if (f.key === "years_experience" && v && (!/^\d+$/.test(v) || Number(v) > 60)) {
        setSaveError("Years of experience must be a whole number between 0 and 60.");
        return;
      }
    }

    const payload = {};
    for (const f of changed) {
      const v = norm(form[f.key]);
      payload[f.key] = f.key === "years_experience" ? (v === "" ? null : Number(v)) : v;
    }

    setSaving(true);
    try {
      await updateDoctorProfile(payload);
      const fresh = await getDoctorProfile();
      const notSaved = changed.filter((f) => norm(fresh[f.key]) !== norm(payload[f.key]));
      setProfile(fresh);
      setForm(toForm(fresh));
      if (notSaved.length > 0) {
        setSaveError(`These could not be saved yet: ${notSaved.map((f) => f.label).join(", ")}.`);
      } else {
        setSuccess(true);
      }
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

  const professional = activeFields.filter((f) => f.section === "professional");
  const about = activeFields.filter((f) => f.section === "about");
  const contact = activeFields.filter((f) => f.section === "contact");

  const facts = [];
  if (profile.created_at) facts.push({ label: "Member since", value: formatMonthYear(profile.created_at) });
  if (profile.years_experience != null && norm(profile.years_experience) !== "") {
    facts.push({ label: "Experience", value: `${profile.years_experience} yrs` });
  }
  if (norm(profile.languages)) facts.push({ label: "Languages", value: profile.languages });

  const facilityFields = facility
    ? [
        { label: "Facility type", value: facility.facility_type ? prettify(facility.facility_type) : "" },
        { label: "KMHFR code", value: facility.kmhfr_code },
        { label: "County", value: facility.county },
        { label: "Sub-county", value: facility.sub_county },
      ].filter((f) => f.value)
    : [];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Your profile</h1>
      <p className={styles.subtitle}>How patients and colleagues see you on Uzima Link.</p>

      <section className={`${styles.card} ${styles.heroCard}`}>
        <div className={styles.banner} />
        <div className={styles.heroBody}>
          <div className={styles.avatarWrap}>
            {profile.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photo_url} alt="Your profile" className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback}>{getInitials(profile.full_name)}</div>
            )}
          </div>

          <div className={styles.heroText}>
            <h2 className={styles.name}>{displayName}</h2>
            <p className={styles.meta}>
              {[profile.specialty, facility?.name].filter(Boolean).join(" · ") || "Add your specialty below"}
            </p>
            <div className={styles.badgeRow}>
              <span className={`${styles.badge} ${profile.kyc_verified ? "" : styles.badgeWarn}`}>
                {profile.kyc_verified ? "Identity verified" : "Identity pending"}
              </span>
              <span className={`${styles.badge} ${profile.is_verified ? "" : styles.badgeWarn}`}>
                {profile.is_verified ? "Email verified" : "Email not verified"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={styles.outlineButton}
          >
            {uploading ? "Uploading..." : "Change photo"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} hidden />
        </div>

        {photoError && <p className={`${styles.error} ${styles.heroError}`}>{photoError}</p>}

        {facts.length > 0 && (
          <div className={styles.facts}>
            {facts.map((f) => (
              <div key={f.label} className={styles.fact}>
                <span className={styles.factValue}>{f.value}</span>
                <span className={styles.factLabel}>{f.label}</span>
              </div>
            ))}
          </div>
        )}
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

      <form onSubmit={handleSave}>
        {professional.length > 0 && (
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>Professional details</h3>
            <div className={styles.grid}>
              {professional.map((f) => (
                <FormField key={f.key} def={f} value={form[f.key] ?? ""} onChange={updateField} />
              ))}
            </div>
            <datalist id="specialties">
              {SPECIALTIES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </section>
        )}

        {about.length > 0 && (
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>About</h3>
            <div className={styles.grid}>
              {about.map((f) => (
                <FormField key={f.key} def={f} value={form[f.key] ?? ""} onChange={updateField} />
              ))}
            </div>
          </section>
        )}

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Contact</h3>
          <div className={styles.grid}>
            <Field label="Email" value={profile.email} />
            {contact.map((f) => (
              <FormField key={f.key} def={f} value={form[f.key] ?? ""} onChange={updateField} />
            ))}
          </div>
        </section>

        {saveError && <p className={styles.error}>{saveError}</p>}

        <div className={styles.saveBar}>
          <button type="submit" disabled={saving || !hasChanges} className={styles.primaryButton}>
            {saving ? "Saving..." : "Save changes"}
          </button>
          {hasChanges && !saving && <span className={styles.unsaved}>You have unsaved changes</span>}
          {success && <span className={styles.success}>Profile updated</span>}
        </div>
      </form>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Facility</h3>
        {facility ? (
          <>
            <p className={styles.facilityName}>{facility.name}</p>
            {facilityFields.length > 0 ? (
              <div className={styles.grid}>
                {facilityFields.map((f) => (
                  <Field key={f.label} label={f.label} value={f.value} />
                ))}
              </div>
            ) : (
              <p className={styles.hint}>
                Registry details (type, county, KMHFR code) will appear here once this facility is matched to the national facility registry.
              </p>
            )}
          </>
        ) : (
          <p className={styles.hint}>No facility is linked to your account yet.</p>
        )}
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Account and verification</h3>
        <div className={styles.grid}>
          <Field label="Member since" value={formatMonthYear(profile.created_at)} />
          <Field label="Email status" value={profile.is_verified ? "Verified" : "Not verified"} />
          <Field
            label="Identity verification"
            value={
              profile.kyc_verified
                ? profile.kyc_verified_at
                  ? `Verified on ${formatDate(profile.kyc_verified_at)}`
                  : "Verified"
                : "Pending review"
            }
          />
          {profile.national_id && <Field label="National ID" value={maskId(profile.national_id)} />}
        </div>
        <p className={styles.hint}>Your name, email, ID and facility come from your registration and verified ID.</p>
      </section>
    </div>
  );
}