"use client";

import { useEffect, useState } from "react";
import { getAllergies, createAllergy, getAllergyRecommendations } from "@/lib/endpoints";
import styles from "./page.module.css";

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
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className={styles.title}>Your allergies</h1>
      <p className={styles.subtitle}>Keep this updated your doctor sees this every time they scan your record.</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.formRow}>
          <input
            placeholder="Allergen (e.g. Penicillin)"
            value={form.allergen}
            onChange={(e) => setForm((f) => ({ ...f, allergen: e.target.value }))}
            className={styles.input}
            required
          />
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
        <input
          placeholder="Reaction (optional)"
          value={form.reaction}
          onChange={(e) => setForm((f) => ({ ...f, reaction: e.target.value }))}
          className={styles.input}
        />
        <button type="submit" disabled={submitting} className={styles.submitButton}>
          {submitting ? "Adding..." : "Add allergy"}
        </button>
      </form>

      {loading ? (
        <p className={styles.loadingText}>Loading...</p>
      ) : allergies.length === 0 ? (
        <p className={styles.emptyText}>No allergies on record.</p>
      ) : (
        <div className={styles.list}>
          {allergies.map((a) => {
            const rec = recommendations.find((r) => r.allergen === a.allergen);
            return (
              <div key={a.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <strong>{a.allergen}</strong>
                  <span className={`${styles.severityTag} ${styles[`severity_${a.severity}`]}`}>{a.severity}</span>
                </div>
                {a.reaction && <p className={styles.reaction}>Reaction: {a.reaction}</p>}
                {rec && <p className={styles.recommendation}>{rec.recommendation}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}