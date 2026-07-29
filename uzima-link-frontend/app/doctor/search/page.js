"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { lookupPatient } from "@/lib/endpoints";
import QrScannerModal from "@/components/QrScanner";
import styles from "./search.module.css";

function DoctorSearchContent() {
  const [searchType, setSearchType] = useState("phone_number");
  const [searchValue, setSearchValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const router = useRouter();

  async function handleSearch(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const patient = await lookupPatient({ [searchType]: searchValue });
      router.push(`/doctor/patient/${patient.id}`);
    } catch (err) {
      setError(err.message);
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
      router.push(`/doctor/patient/${patient.id}`);
    } catch (err) {
      setError("No patient found for that card.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Find a patient</h1>

      <form onSubmit={handleSearch} className={styles.form}>
        <select value={searchType} onChange={(e) => setSearchType(e.target.value)} className={styles.select}>
          <option value="phone_number">Phone number</option>
          <option value="national_id">National ID</option>
          <option value="system_uid">Smart Card ID</option>
        </select>
        <input value={searchValue} onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Enter value" className={styles.input} required />

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Searching..." : "Find patient"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setShowScanner(true)}
        className={styles.button}
        style={{ marginTop: "0.75rem", background: "transparent", border: "2px solid #334155" }}
      >
        📇 Scan patient card instead
      </button>

      {showScanner && (
        <QrScannerModal onScan={handleQrScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}

export default function DoctorSearchPage() {
  return <DoctorSearchContent />;
}