"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { lookupPatient, createPatient, createAllergy } from "@/lib/endpoints";
import QrScannerModal from "@/components/QrScanner";
import styles from "./kiosk.module.css";

function KioskContent() {
  const { user } = useAuth();
  const [view, setView] = useState("search"); // "search" | "not_found" | "register"
  const [searchType, setSearchType] = useState("phone_number");
  const [searchValue, setSearchValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentLookups, setRecentLookups] = useState([]);
  const [language, setLanguage] = useState("en");
  const [showScanner, setShowScanner] = useState(false);
  const router = useRouter();

  const [allergies, setAllergies] = useState([
    { allergen: "", severity: "Mild", reaction: "" },
  ]);

  const [newPatient, setNewPatient] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "",
    phone_number: "",
    national_id: "",
  });

  useEffect(() => {
    const savedLang = sessionStorage.getItem("uzima_kiosk_lang");
    if (savedLang) setLanguage(savedLang);

    const savedLookups = sessionStorage.getItem("uzima_recent_lookups");
    if (savedLookups) setRecentLookups(JSON.parse(savedLookups));
  }, []);

  function selectLanguage(lang) {
    setLanguage(lang);
    sessionStorage.setItem("uzima_kiosk_lang", lang);
  }

  function addToRecent(patient) {
    const entry = {
      id: patient.id,
      name: patient.full_name,
      system_uid: patient.system_uid,
      time: Date.now(),
    };
    const updated = [
      entry,
      ...recentLookups.filter((p) => p.id !== patient.id),
    ].slice(0, 6);
    setRecentLookups(updated);
    sessionStorage.setItem("uzima_recent_lookups", JSON.stringify(updated));
  }

  function updateAllergyField(index, field, value) {
    setAllergies((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addAllergyRow() {
    setAllergies((prev) => [...prev, { allergen: "", severity: "Mild", reaction: "" }]);
  }

  function removeAllergyRow(index) {
    setAllergies((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSearch(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const patient = await lookupPatient({ [searchType]: searchValue });
      addToRecent(patient);
      router.push(`/kiosk/intake/${patient.id}`);
    } catch (err) {
      if (err.message.toLowerCase().includes("not found")) {
        setView("not_found");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleQrScan(decodedText) {
    setShowScanner(false);
    setError("");
    setLoading(true);
    try {
      const patient = await lookupPatient({ system_uid: decodedText });
      addToRecent(patient);
      router.push(`/kiosk/intake/${patient.id}`);
    } catch (err) {
      setSearchValue(decodedText);
      setView("not_found");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateNewPatient(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const patient = await createPatient(newPatient);

      const validAllergies = allergies.filter((a) => a.allergen.trim() !== "");
      for (const a of validAllergies) {
        try {
          await createAllergy({
            patient_id: patient.id,
            allergen: a.allergen,
            severity: a.severity,
            reaction: a.reaction || null,
          });
        } catch (allergyErr) {
          console.error("Failed to save allergy:", a.allergen, allergyErr.message);
        }
      }

      addToRecent(patient);
      router.push(`/kiosk/intake/${patient.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const searchTypeLabels = {
    phone_number: "Phone",
    national_id: "National ID",
    system_uid: "Smart Card",
  };

  return (
    <div className={styles.grid}>
      <div className={styles.mainCard}>
        {view === "search" && (
          <>
            <h1 className={styles.title}>Patient check-in</h1>
            <p className={styles.subtitle}>Search by phone, ID, or smart card</p>

            <div className={styles.langRow}>
              <span className={styles.langLabel}>Language:</span>
              {[["en", "English"], ["sw", "Kiswahili"]].map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => selectLanguage(code)}
                  className={language === code ? styles.langButtonActive : styles.langButton}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className={styles.typeRow}>
              {Object.entries(searchTypeLabels).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSearchType(type)}
                  className={searchType === type ? styles.typeButtonActive : styles.typeButton}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className={styles.form}>
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={`Enter ${searchTypeLabels[searchType].toLowerCase()}`}
                className={styles.input}
                required
              />
              <button type="submit" disabled={loading} className={styles.button}>
                {loading ? "Searching..." : "Look up patient"}
              </button>
            </form>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actionRow}>
              <button type="button" onClick={() => setView("register")} className={styles.secondaryAction}>
                + New patient
              </button>
              <button type="button" onClick={() => setShowScanner(true)} className={styles.secondaryAction}>
                📇 Scan ID card
              </button>
            </div>
          </>
        )}

        {view === "not_found" && (
          <div className={styles.notFoundBox}>
            <div className={styles.notFoundIcon}>🔍</div>
            <h2 className={styles.notFoundTitle}>No record found</h2>
            <p className={styles.notFoundText}>
              We couldn't find a patient matching <strong>{searchValue}</strong>.
              Would you like to register them as a new patient?
            </p>
            <div className={styles.notFoundActions}>
              <button
                onClick={() => { setView("search"); setSearchValue(""); }}
                className={styles.secondaryAction}
              >
                Try a different search
              </button>
              <button onClick={() => setView("register")} className={styles.button}>
                Yes, register new patient
              </button>
            </div>
          </div>
        )}

        {view === "register" && (
          <>
            <h1 className={styles.title}>New patient</h1>
            <p className={styles.subtitle}>Let's get them registered</p>

            <form onSubmit={handleCreateNewPatient} className={styles.form}>
              <input placeholder="Full name" value={newPatient.full_name}
                onChange={(e) => setNewPatient((p) => ({ ...p, full_name: e.target.value }))}
                className={styles.input} required />
              <input placeholder="Date of birth (DD-MM-YYYY)" value={newPatient.date_of_birth}
                onChange={(e) => setNewPatient((p) => ({ ...p, date_of_birth: e.target.value }))}
                className={styles.input} required />
              <input placeholder="Gender" value={newPatient.gender}
                onChange={(e) => setNewPatient((p) => ({ ...p, gender: e.target.value }))}
                className={styles.input} required />
              <input placeholder="Phone number" value={newPatient.phone_number}
                onChange={(e) => setNewPatient((p) => ({ ...p, phone_number: e.target.value }))}
                className={styles.input} />
              <input placeholder="National ID" value={newPatient.national_id}
                onChange={(e) => setNewPatient((p) => ({ ...p, national_id: e.target.value }))}
                className={styles.input} />

              <div className={styles.allergySection}>
                <p className={styles.allergyLabel}>Known allergies (optional)</p>
                {allergies.map((a, i) => (
                  <div key={i} className={styles.allergyRow}>
                    <input placeholder="Allergen" value={a.allergen}
                      onChange={(e) => updateAllergyField(i, "allergen", e.target.value)}
                      className={styles.allergyInput} />
                    <select value={a.severity} onChange={(e) => updateAllergyField(i, "severity", e.target.value)}
                      className={styles.allergySelect}>
                      <option value="Mild">Mild</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Severe">Severe</option>
                    </select>
                    {allergies.length > 1 && (
                      <button type="button" onClick={() => removeAllergyRow(i)} className={styles.removeRow}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addAllergyRow} className={styles.addRow}>+ Add another</button>
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button type="submit" disabled={loading} className={styles.button}>
                {loading ? "Registering..." : "Register & continue"}
              </button>
            </form>
            <button onClick={() => setView("search")} className={styles.backLink}>
              ← Back to search
            </button>
          </>
        )}
      </div>

      <div className={styles.sideCard}>
        <div className={styles.statBox}>
          <p className={styles.statLabel}>Looked up this session</p>
          <p className={styles.statValue}>{recentLookups.length}</p>
        </div>

        <div className={styles.recentSection}>
          <p className={styles.recentTitle}>Recent lookups</p>
          {recentLookups.length === 0 ? (
            <p className={styles.recentEmpty}>None yet this session</p>
          ) : (
            recentLookups.map((p) => (
              <button key={p.id} onClick={() => router.push(`/kiosk/intake/${p.id}`)} className={styles.recentItem}>
                <span className={styles.recentAvatar}>{p.name?.[0]?.toUpperCase() || "?"}</span>
                <span className={styles.recentInfo}>
                  <span className={styles.recentName}>{p.name}</span>
                  <span className={styles.recentMeta}>{p.system_uid}</span>
                </span>
                <span className={styles.recentTime}>
                  {new Date(p.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {showScanner && (
        <QrScannerModal onScan={handleQrScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}

export default function KioskPage() {
  return <KioskContent />;
}