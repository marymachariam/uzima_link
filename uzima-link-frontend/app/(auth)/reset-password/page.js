"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "@/lib/endpoints";
import styles from "../auth.module.css";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
          {!token ? (
            <>
              <h1 className={styles.title}>Invalid link</h1>
              <p className={styles.subtitle}>This reset link is missing a token. Please request a new one.</p>
              <a href="/forgot-password" className={styles.link}>Request a new link</a>
            </>
          ) : done ? (
            <>
              <h1 className={styles.title}>Password updated</h1>
              <p className={styles.subtitle}>You can now log in with your new password.</p>
              <button onClick={() => router.push("/login")} className={styles.button}>
                Go to sign in
              </button>
            </>
          ) : (
            <>
              <h1 className={styles.title}>Set a new password</h1>
              <form onSubmit={handleSubmit} className={styles.form}>
                <input type="password" placeholder="New password" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={styles.input} required />
                {error && <p className={styles.error}>{error}</p>}
                <button type="submit" disabled={loading} className={styles.button}>
                  {loading ? "Saving..." : "Reset password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}