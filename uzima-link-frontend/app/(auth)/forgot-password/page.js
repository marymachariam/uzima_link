"use client";

import { useState } from "react";
import { forgotPassword } from "@/lib/endpoints";
import styles from "./page.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {sent ? (
          <>
            <h1 className={styles.title}>Check your email</h1>
            <p className={styles.text}>
              If an account exists with that email, we have sent a link to reset your password.
              It expires in 30 minutes.
            </p>
            <a href="/login" className={styles.link}>Back to login</a>
          </>
        ) : (
          <>
            <h1 className={styles.title}>Reset your password</h1>
            <p className={styles.text}>Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className={styles.form}>
              <input type="email" placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input} required />
              {error && <p className={styles.error}>{error}</p>}
              <button type="submit" disabled={loading} className={styles.button}>
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
            <a href="/login" className={styles.link}>Back to login</a>
          </>
        )}
      </div>
    </div>
  );
}