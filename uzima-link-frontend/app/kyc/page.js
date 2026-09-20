"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getKycStatus, submitKyc } from "@/lib/endpoints";
import { isLoggedIn } from "@/lib/auth";
import styles from "../(auth)/auth.module.css";

export default function KycPage() {
  const router = useRouter();
  const [status, setStatus] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [idDocument, setIdDocument] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    getKycStatus()
      .then((res) => {
        setStatus(res);
        if (res.kyc_verified) router.replace("/patient");
      })
      .catch((err) => setError(err.message))
      .finally(() => setChecking(false));
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!selfie || !idDocument) {
      setError("Please upload both a selfie and a photo of your ID document.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("selfie", selfie);
      formData.append("id_document", idDocument);
      const res = await submitKyc(formData);
      setStatus(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className={styles.page}>
        <div className={styles.leftPanel}>
          <div className={styles.leftBrand}>
            <div className={styles.leftBrandDot} />
            <span className={styles.leftBrandName}>Uzima Link</span>
          </div>
          <img src="/image.png" alt="" className={styles.leftImage} />
          <p className={styles.leftCaption}>Your health record, wherever care finds you.</p>
        </div>
        <div className={styles.rightPanel}>
          <div className={styles.card}>
            <p className={styles.subtitle}>Checking your verification status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.leftPanel}>
        <div className={styles.leftBrand}>
          <div className={styles.leftBrandDot} />
          <span className={styles.leftBrandName}>Uzima Link</span>
        </div>
        <img src="/image.png" alt="" className={styles.leftImage} />
        <p className={styles.leftCaption}>Your health record, wherever care finds you.</p>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.card}>
          {status?.kyc_status === "pending" ? (
            <>
              <h1 className={styles.title}>Verification pending</h1>
              <p className={styles.success}>{status.message}</p>
              <p className={styles.subtitle}>
                This usually takes a short while. You&apos;ll be able to use your account once it&apos;s approved.
              </p>
            </>
          ) : (
            <>
              <h1 className={styles.title}>Verify your identity</h1>
              <p className={styles.subtitle}>
                To keep your health record secure, we need a quick selfie and a photo of your ID.
              </p>

              {status?.kyc_status === "rejected" && <p className={styles.error}>{status.message}</p>}
              {error && <p className={styles.error}>{error}</p>}

              <form onSubmit={handleSubmit} className={styles.form}>
                <label className={styles.label}>Selfie</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setSelfie(e.target.files?.[0] || null)}
                  className={styles.input}
                  required
                />

                <label className={styles.label}>ID document photo</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setIdDocument(e.target.files?.[0] || null)}
                  className={styles.input}
                  required
                />

                <button type="submit" disabled={loading} className={styles.button}>
                  {loading ? "Submitting..." : "Submit for review"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}