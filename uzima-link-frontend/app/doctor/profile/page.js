"use client";

import { useEffect, useRef, useState } from "react";
import { getDoctorProfile, updateDoctorProfile, uploadDoctorPhoto } from "@/lib/endpoints";
import { 
  User, 
  Mail, 
  Phone, 
  Award, 
  ShieldCheck, 
  ShieldAlert, 
  Building2, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Stethoscope, 
  Clock, 
  Languages, 
  Calendar,
  Save
} from "lucide-react";
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

const FIELDS = [
  { key: "specialty", label: "Specialty", section: "professional", placeholder: "e.g. Paediatrics", list: "specialties", icon: Stethoscope },
  { key: "license_number", label: "Medical licence number", section: "professional", placeholder: "KMPDC registration number", icon: Award },
  { key: "qualifications", label: "Qualifications", section: "professional", placeholder: "e.g. MBChB, MMed Radiology", icon: FileText },
  { key: "years_experience", label: "Years of experience", section: "professional", type: "number", placeholder: "e.g. 8", icon: Clock },
  { key: "languages", label: "Languages spoken", section: "professional", placeholder: "e.g. English, Swahili", icon: Languages },
  { key: "consultation_hours", label: "Consultation hours", section: "professional", placeholder: "e.g. Mon to Fri, 8am to 5pm", full: true, icon: Calendar },
  { key: "bio", label: "About you", section: "about", type: "textarea", placeholder: "A short introduction that patients and colleagues can read.", max: 600, full: true, icon: User },
  { key: "phone_number", label: "Phone number", section: "contact", type: "tel", placeholder: "+254712345678", icon: Phone },
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
    { label: "Add a professional profile photo", done: !!p.photo_url },
    has(p, "specialty") && { label: "Specify your medical specialty", done: !!norm(p.specialty) },
    has(p, "license_number") && { label: "Provide your professional licence number", done: !!norm(p.license_number) },
    has(p, "bio") && { label: "Write a short professional biography", done: !!norm(p.bio) },
    has(p, "phone_number") && { label: "Add a secure contact phone number", done: !!norm(p.phone_number) },
    { label: "Verify your email address", done: !!p.is_verified },
    { label: "Complete national identity verification", done: !!p.kyc_verified },
  ];
  return items.filter(Boolean);
}

function Field({ label, value, icon: Icon }) {
  return (
    <div className={styles.field}>
      <span className={styles.labelGroup}>
        {Icon && <Icon size={14} className={styles.fieldIcon} />}
        <span className={styles.label}>{label}</span>
      </span>
      <span className={styles.value}>{value || "Not provided"}</span>
    </div>
  );
}

function FormField({ def, value, onChange }) {
  const id = `field-${def.key}`;
  const IconComponent = def.icon;
  return (
    <div className={`${styles.field} ${def.full ? styles.fieldFull : ""}`}>
      <label htmlFor={id} className={styles.labelGroup}>
        {IconComponent && <IconComponent size={14} className={styles.fieldIcon} />}
        <span className={styles.label}>{def.label}</span>
      </label>
      {def.type === "textarea" ? (
        <div className={styles.textareaWrapper}>
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
        </div>
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
        setSaveError("Please enter your medical specialty.");
        return;
      }
      if (f.key === "phone_number" && !PHONE_PATTERN.test(v)) {
        setSaveError("Enter a valid phone number format, for example +254712345678.");
        return;
      }
      if (f.key === "years_experience" && v && (!/^\d+$/.test(v) || Number(v) > 60)) {
        setSaveError("Years of experience must be a valid whole number between 0 and 60.");
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
        setSaveError(`These fields could not be updated: ${notSaved.map((f) => f.label).join(", ")}.`);
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
      setPhotoError("Please select a valid image file.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Image size must be less than 5 MB.");
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
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p className={styles.subtitle}>Loading clinical profile data...</p>
        </div>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className={styles.page}>
        <div className={styles.errorCardBox}>
          <AlertCircle size={32} className={styles.errorIconSymbol} />
          <h1 className={styles.title}>Unable to load profile</h1>
          <p className={styles.error}>{loadError || "Could not retrieve your profile information."}</p>
          <button type="button" onClick={loadProfile} className={styles.primaryButton}>
            Try again
          </button>
        </div>
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
  if (profile.created_at) facts.push({ label: "Member since", value: formatMonthYear(profile.created_at), icon: Calendar });
  if (profile.years_experience != null && norm(profile.years_experience) !== "") {
    facts.push({ label: "Experience", value: `${profile.years_experience} years`, icon: Clock });
  }
  if (norm(profile.languages)) facts.push({ label: "Languages", value: profile.languages, icon: Languages });

  const facilityFields = facility
    ? [
        { label: "Facility type", value: facility.facility_type ? prettify(facility.facility_type) : "", icon: Building2 },
        { label: "KMHFR code", value: facility.kmhfr_code, icon: Award },
        { label: "County", value: facility.county, icon: Building2 },
        { label: "Sub-county", value: facility.sub_county, icon: Building2 },
      ].filter((f) => f.value)
    : [];

  return (
    <div className={styles.page}>
      
      {/* Page Header */}
      <div className={styles.pageHeaderBlock}>
        <div>
          <h1 className={styles.title}>Professional Profile</h1>
          <p className={styles.subtitle}>Manage how your clinical credentials and profile appear across the Uzima Link network.</p>
        </div>
      </div>

      {/* Hero Card */}
      <section className={`${styles.card} ${styles.heroCard}`}>
        <div className={styles.banner} />
        <div className={styles.heroBody}>
          <div className={styles.avatarWrap}>
            {profile.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photo_url} alt="Profile preview" className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback}>{getInitials(profile.full_name)}</div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className={styles.avatarOverlayButton}
              title="Change photo"
            >
              <Camera size={16} />
            </button>
          </div>

          <div className={styles.heroText}>
            <h2 className={styles.name}>{displayName}</h2>
            <p className={styles.meta}>
              {[profile.specialty, facility?.name].filter(Boolean).join(" · ") || "Specify your medical specialty below"}
            </p>
            <div className={styles.badgeRow}>
              <span className={`${styles.badge} ${profile.kyc_verified ? styles.badgeSuccess : styles.badgeWarn}`}>
                {profile.kyc_verified ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                {profile.kyc_verified ? "Identity Verified" : "Identity Pending"}
              </span>
              <span className={`${styles.badge} ${profile.is_verified ? styles.badgeSuccess : styles.badgeWarn}`}>
                {profile.is_verified ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                {profile.is_verified ? "Email Verified" : "Email Unverified"}
              </span>
            </div>
          </div>

          <div className={styles.heroActions}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className={styles.outlineButton}
            >
              <Camera size={15} />
              {uploading ? "Uploading..." : "Change Photo"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} hidden />
          </div>
        </div>

        {photoError && (
          <div className={`${styles.errorAlert} ${styles.heroErrorMargin}`}>
            <AlertCircle size={16} />
            <span>{photoError}</span>
          </div>
        )}

        {facts.length > 0 && (
          <div className={styles.factsGrid}>
            {facts.map((f) => {
              const FactIcon = f.icon;
              return (
                <div key={f.label} className={styles.factItem}>
                  {FactIcon && <FactIcon size={16} className={styles.factIcon} />}
                  <div>
                    <span className={styles.factValue}>{f.value}</span>
                    <span className={styles.factLabel}>{f.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Profile Strength Checklist */}
      {percent < 100 && (
        <section className={styles.card}>
          <div className={styles.progressHeader}>
            <div>
              <h3 className={styles.cardTitle}>Profile Completion Status</h3>
              <p className={styles.cardSubtitle}>Complete missing fields to build maximum patient trust.</p>
            </div>
            <span className={styles.percentBadge}>{percent}% Complete</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressBar} style={{ width: `${percent}%` }} />
          </div>
          <ul className={styles.checklist}>
            {checklist.map((c) => (
              <li key={c.label} className={c.done ? styles.checkDone : styles.checkTodo}>
                {c.done ? <CheckCircle2 size={16} className={styles.checkIconDone} /> : <div className={styles.checkCircleTodo} />}
                <span>{c.label}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Profile Editing Form */}
      <form onSubmit={handleSave}>
        
        {professional.length > 0 && (
          <section className={styles.card}>
            <div className={styles.sectionCardHeader}>
              <Stethoscope size={20} className={styles.sectionIcon} />
              <div>
                <h3 className={styles.cardTitle}>Professional Credentials</h3>
                <p className={styles.cardSubtitle}>Your medical background, qualifications, and active practice details.</p>
              </div>
            </div>
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
            <div className={styles.sectionCardHeader}>
              <User size={20} className={styles.sectionIcon} />
              <div>
                <h3 className={styles.cardTitle}>Biography & Background</h3>
                <p className={styles.cardSubtitle}>Introduce yourself to patients and collaborating clinicians.</p>
              </div>
            </div>
            <div className={styles.grid}>
              {about.map((f) => (
                <FormField key={f.key} def={f} value={form[f.key] ?? ""} onChange={updateField} />
              ))}
            </div>
          </section>
        )}

        <section className={styles.card}>
          <div className={styles.sectionCardHeader}>
            <Phone size={20} className={styles.sectionIcon} />
            <div>
              <h3 className={styles.cardTitle}>Contact Information</h3>
              <p className={styles.cardSubtitle}>Secure communication channels for professional use.</p>
            </div>
          </div>
          <div className={styles.grid}>
            <Field label="Email Address" value={profile.email} icon={Mail} />
            {contact.map((f) => (
              <FormField key={f.key} def={f} value={form[f.key] ?? ""} onChange={updateField} />
            ))}
          </div>
        </section>

        {saveError && (
          <div className={styles.errorAlert}>
            <AlertCircle size={18} />
            <span>{saveError}</span>
          </div>
        )}

        {/* Sticky Action Footer */}
        <div className={styles.saveBar}>
          <button type="submit" disabled={saving || !hasChanges} className={styles.primaryButton}>
            <Save size={16} />
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
          {hasChanges && !saving && (
            <span className={styles.unsavedNotice}>
              <AlertCircle size={14} /> You have unsaved edits
            </span>
          )}
          {success && (
            <span className={styles.successNotice}>
              <CheckCircle2 size={16} /> Profile successfully updated
            </span>
          )}
        </div>
      </form>

      {/* Facility Information Box */}
      <section className={styles.card}>
        <div className={styles.sectionCardHeader}>
          <Building2 size={20} className={styles.sectionIcon} />
          <div>
            <h3 className={styles.cardTitle}>Assigned Medical Facility</h3>
            <p className={styles.cardSubtitle}>Primary workplace linked via regional regulatory records.</p>
          </div>
        </div>
        {facility ? (
          <div className={styles.facilityContent}>
            <p className={styles.facilityName}>{facility.name}</p>
            {facilityFields.length > 0 ? (
              <div className={styles.grid}>
                {facilityFields.map((f) => (
                  <Field key={f.label} label={f.label} value={f.value} icon={f.icon} />
                ))}
              </div>
            ) : (
              <p className={styles.hint}>
                Regulatory registry data (type, county, KMHFR code) will automatically mirror once synchronized with the national health registry.
              </p>
            )}
          </div>
        ) : (
          <p className={styles.hint}>No medical facility is currently linked to your practitioner account.</p>
        )}
      </section>

      {/* Governance & System Verification Box */}
      <section className={styles.card}>
        <div className={styles.sectionCardHeader}>
          <ShieldCheck size={20} className={styles.sectionIcon} />
          <div>
            <h3 className={styles.cardTitle}>Account Governance & Verification</h3>
            <p className={styles.cardSubtitle}>Official details derived from your verified onboarding credentials.</p>
          </div>
        </div>
        <div className={styles.grid}>
          <Field label="Member Since" value={formatMonthYear(profile.created_at)} icon={Calendar} />
          <Field label="Email Status" value={profile.is_verified ? "Verified Active" : "Unverified"} icon={Mail} />
          <Field
            label="Identity Status"
            value={
              profile.kyc_verified
                ? profile.kyc_verified_at
                  ? `Verified on ${formatDate(profile.kyc_verified_at)}`
                  : "Verified"
                : "Pending Review"
            }
            icon={ShieldCheck}
          />
          {profile.national_id && <Field label="National ID Number" value={maskId(profile.national_id)} icon={Award} />}
        </div>
        <p className={styles.hint}>
          Legal names, credentials, and identity numbers are governed by official registry validation standards and cannot be edited directly. Contact support for updates.
        </p>
      </section>

    </div>
  );
}