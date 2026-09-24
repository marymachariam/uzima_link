"use client";

import { useState } from "react";
import { doctorForgotPassword } from "@/lib/endpoints";
import styles from "../auth.module.css";
import Image from "next/image";

export default function DoctorForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);


  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await doctorForgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.leftPanel}>
        <div className={styles.leftBrand}>
          <span className={styles.leftBrandName}>
            <Image
              src="/logo1.png"
              alt="Uzima Link"
              width={100}
              height={100}
              className={styles.brandLogo}
              priority
            />
            </span>
        </div>
        <img src="/image.png" alt="" className={styles.leftImage} />
        <p className={styles.leftCaption}>Your health record, wherever care finds you.</p>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.card}>
          {sent ? (
            <>
              <h1 className={styles.title}>Check your email</h1>
              <p className={styles.subtitle}>
                If an account exists with that email, we&apos;ve sent a reset link.
              </p>
              <a href="/login/staff" className={styles.link}>Back to staff sign in</a>
            </>
          ) : (
            <>
              <h1 className={styles.title}>Reset your password</h1>
              <p className={styles.subtitle}>Enter your doctor email and we&apos;ll send you a reset link.</p>
              <form onSubmit={handleSubmit} className={styles.form}>
                <input type="email" placeholder="Email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input} required />
                {error && <p className={styles.error}>{error}</p>}
                <button type="submit" disabled={loading} className={styles.button}>
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>
              <p className={styles.footer}>
                <a href="/login/staff" className={styles.link}>Back to staff sign in</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}