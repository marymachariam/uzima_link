"use client";

import { useEffect, useState } from "react";
import { getFrontdeskProfile, updateFrontdeskProfile, uploadFrontdeskPhoto } from "@/lib/endpoints";
import styles from "./page.module.css";

export default function KioskProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ full_name: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getFrontdeskProfile()
      .then((p) => {
        setProfile(p);
        setForm({ full_name: p.full_name || "" });
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const updated = await updateFrontdeskProfile(form);
      setProfile(updated);
      setMessage("Profile successfully updated.");
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const updated = await uploadFrontdeskPhoto(formData);
      setProfile(updated);
      setMessage("Profile photo updated.");
    } catch (err) {
      setError(err.message || "Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  function handleCopyInviteCode() {
    const inviteCode = profile?.facility?.invite_code;
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className={styles.centerBox}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading profile...</p>
      </div>
    );
  }

  const facility = profile?.facility;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerBlock}>
        <h1 className={styles.title}>Account Profile</h1>
        <p className={styles.subtitle}>Manage your personal credentials and facility details.</p>
      </div>

      {message && <div className={styles.successBanner}>{message}</div>}
      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Top Profile Card */}
      <div className={styles.topCard}>
        <div className={styles.photoRow}>
          <div className={styles.photoWrap}>
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt="Profile" className={styles.photo} />
            ) : (
              <div className={styles.photoPlaceholder}>
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "?"}
              </div>
            )}
          </div>
          <div className={styles.userInfo}>
            <h2 className={styles.nameText}>{profile?.full_name || "Unnamed User"}</h2>
            <p className={styles.emailText}>{profile?.email || "No email provided"}</p>
            <div className={styles.roleBadgeContainer}>
              <span className={styles.roleBadge}>{profile?.role || "frontdesk"}</span>
            </div>
            <label className={styles.photoButton}>
              {uploadingPhoto ? "Uploading photo..." : "Change avatar photo"}
              <input type="file" accept="image/jpeg,image/png" onChange={handlePhotoChange} hidden />
            </label>
          </div>
        </div>

        <div className={styles.badgeRow}>
          <span className={profile?.is_verified ? styles.badgeGood : styles.badgeBad}>
            {profile?.is_verified ? "✓ Email Verified" : "⚠ Email Unverified"}
          </span>
          <span className={profile?.kyc_verified ? styles.badgeGood : styles.badgeNeutral}>
            {profile?.kyc_verified ? "✓ KYC Verified" : "KYC Pending"}
          </span>
          <span className={styles.badgeNeutral}>
            Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
          </span>
        </div>
      </div>

      <div className={styles.gridSection}>
        {/* Edit Details Section */}
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>Edit Personal Details</h3>
          <form onSubmit={handleSave} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Full Name</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ full_name: e.target.value })}
                className={styles.input}
                placeholder="Enter your full name"
                required
              />
            </div>
            <button type="submit" disabled={saving} className={styles.submitButton}>
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Facility Details & Invite Code Section */}
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>Linked Facility</h3>
          {facility ? (
            <div className={styles.facilityContent}>
              <div className={styles.facilityHeader}>
                <div>
                  <h4 className={styles.facilityName}>{facility.name}</h4>
                  <span className={styles.facilityTypeTag}>{facility.facility_type || "Facility"}</span>
                </div>
              </div>

              <div className={styles.facilityGrid}>
                <FacilityFact label="County" value={facility.county} />
                <FacilityFact label="Sub-county" value={facility.sub_county} />
                <FacilityFact label="KMHFR Code" value={facility.kmhfr_code} />
                <FacilityFact label="Source" value={facility.source} />
              </div>

              {facility.invite_code && (
                <div className={styles.inviteWrap}>
                  <div className={styles.inviteLabelRow}>
                    <span className={styles.inviteLabel}>Facility Invite Code</span>
                    <span className={styles.inviteSubHint}>Share to onboard staff</span>
                  </div>
                  <div className={styles.inviteRow}>
                    <code className={styles.inviteCodeText}>{facility.invite_code}</code>
                    <button type="button" onClick={handleCopyInviteCode} className={styles.copyButton}>
                      {copied ? "Copied!" : "Copy Code"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.emptyFacility}>
              <p className={styles.emptyText}>No facility linked to this user account.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FacilityFact({ label, value }) {
  return (
    <div className={styles.factBox}>
      <span className={styles.factLabel}>{label}</span>
      <p className={styles.factValue}>{value || "—"}</p>
    </div>
  );
}