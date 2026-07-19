"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPatientDashboard } from "@/lib/endpoints";
import styles from "./allergies.module.css";
import { createAllergy } from "@/lib/endpoints";

function AllergiesContent() {
  const [showForm, setShowForm] = useState(false);
  const [allergen, setAllergen] = useState("");
  const [severity, setSeverity] = useState("Mild");
  const [reaction, setReaction] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const { user } = useAuth();
  const [allergies, setAllergies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function handleAddAllergy(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const newAllergy = await createAllergy({
        patient_id: user.patientId,
        allergen,
        severity,
        reaction: reaction || null,
      });
      setAllergies((prev) => [...prev, newAllergy]);
      setAllergen("");
      setReaction("");
      setShowForm(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const result = await getPatientDashboard(user.patientId);
        setAllergies(result.allergies);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (user?.patientId) load();
  }, [user]);

  return (
    <div>
      <h1 className={styles.title}>My allergies</h1>
      <p className={styles.subtitle}>Whats on file for your care team</p>
      <button
        onClick={() => setShowForm(!showForm)}
        className={styles.addButton}
      >
        {showForm ? "Cancel" : "+ Add an allergy"}
      </button>

      {showForm && (
        <form onSubmit={handleAddAllergy} className={styles.form}>
          <input
            placeholder="What are you allergic to?"
            value={allergen}
            onChange={(e) => setAllergen(e.target.value)}
            className={styles.input}
            required
          />
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className={styles.input}
          >
            <option value="Mild">Mild</option>
            <option value="Moderate">Moderate</option>
            <option value="Severe">Severe</option>
          </select>
          <input
            placeholder="Reaction (optional)"
            value={reaction}
            onChange={(e) => setReaction(e.target.value)}
            className={styles.input}
          />
          {formError && <p className={styles.errorText}>{formError}</p>}
          <button type="submit" disabled={saving} className={styles.saveButton}>
            {saving ? "Saving..." : "Save allergy"}
          </button>
        </form>
      )}
      {loading ? (
        <p className={styles.empty}>Loading...</p>
      ) : error ? (
        <p className={styles.errorText}>{error}</p>
      ) : allergies.length === 0 ? (
        <div className={styles.emptyCard}>
          <p>
            No allergies on file. If you have any, let your doctor or kiosk
            operator know at your next visit.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {allergies.map((a) => (
            <div key={a.id} className={styles.allergyCard}>
              <div className={styles.allergyHeader}>
                <span className={styles.allergen}>{a.allergen}</span>
                <span className={styles.severity}>{a.severity}</span>
              </div>
              {a.reaction && (
                <p className={styles.reaction}>Reaction: {a.reaction}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AllergiesPage() {
  return <AllergiesContent />;
}
