"use client";

import { useEffect, useState } from "react";
import { getAllergies, createAllergy, getAllergyRecommendations } from "@/lib/endpoints";
import styles from "./page.module.css";
import { 
  AlertTriangle, 
  ShieldAlert, 
  PlusCircle, 
  AlertCircle, 
  Sparkles, 
  Info, 
  CheckCircle2 
} from "lucide-react";

export default function AllergiesPage() {
  const [allergies, setAllergies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ allergen: "", severity: "mild", reaction: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    setLoading(true);
    Promise.all([getAllergies(), getAllergyRecommendations().catch(() => [])])
      .then(([a, r]) => {
        setAllergies(a);
        setRecommendations(r);
      })
      .finally(() => setLoading(false));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await createAllergy(form);
      setForm({ allergen: "", severity: "mild", reaction: "" });
      loadData();
    } catch (err) {
      setError(err.message || "Failed to add allergy. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerBadge}>
          <Sparkles size={14} /> Clinical Safety Record
        </div>
        <h1 className={styles.title}>Your Allergies & Sensitivities</h1>
        <p className={styles.subtitle}>
          Keep this list updated. Your doctor reviews this critical information instantly whenever they scan your medical record.
        </p>
      </div>

      {/* Add Allergy Form */}
      <form onSubmit={handleSubmit} className={styles.formCard}>
        <div className={styles.formCardHeader}>
          <AlertTriangle size={18} className={styles.formCardIcon} />
          <h2 className={styles.formTitle}>Add New Allergy</h2>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.formRow}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Allergen Name</label>
            <input
              placeholder="e.g. Penicillin, Peanuts, Latex..."
              value={form.allergen}
              onChange={(e) => setForm((f) => ({ ...f, allergen: e.target.value }))}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Severity Level</label>
            <select
              value={form.severity}
              onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
              className={styles.select}
            >
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Reaction Details (Optional)</label>
          <input
            placeholder="e.g. Hives, shortness of breath, mild rash..."
            value={form.reaction}
            onChange={(e) => setForm((f) => ({ ...f, reaction: e.target.value }))}
            className={styles.input}
          />
        </div>

        <button type="submit" disabled={submitting} className={styles.submitButton}>
          {submitting ? (
            <span className={styles.submittingState}>
              <span className={styles.spinner} /> Adding record...
            </span>
          ) : (
            <>
              <PlusCircle size={18} /> Add Allergy
            </>
          )}
        </button>
      </form>

      {/* Allergies List Section */}
      <div className={styles.listSection}>
        <div className={styles.listHeader}>
          <h2 className={styles.sectionTitle}>Recorded Allergies</h2>
          <span className={styles.listCount}>{allergies.length} active records</span>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinnerDark} />
            <p className={styles.loadingText}>Loading allergy records...</p>
          </div>
        ) : allergies.length === 0 ? (
          <div className={styles.emptyContainer}>
            <CheckCircle2 size={36} className={styles.emptyIcon} />
            <p className={styles.emptyText}>No allergies on record. You can safely add any known sensitivities above.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {allergies.map((a) => {
              const rec = recommendations.find((r) => r.allergen === a.allergen);
              return (
                <div key={a.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.allergenInfo}>
                      <ShieldAlert size={18} className={styles.allergenIcon} />
                      <strong className={styles.allergenName}>{a.allergen}</strong>
                    </div>
                    <span className={`${styles.severityTag} ${styles[`severity_${a.severity}`]}`}>
                      {a.severity}
                    </span>
                  </div>

                  {a.reaction && (
                    <p className={styles.reaction}>
                      <span className={styles.reactionLabel}>Reaction:</span> {a.reaction}
                    </p>
                  )}

                  {rec && (
                    <div className={styles.recommendationBox}>
                      <Info size={16} className={styles.recommendationIcon} />
                      <p className={styles.recommendationText}>{rec.recommendation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}