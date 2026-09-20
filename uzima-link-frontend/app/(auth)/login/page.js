"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { patientLoginStart, patientLoginChooseChannel } from "@/lib/endpoints";
import styles from "../auth.module.css";

const METHODS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "national_id", label: "National ID" },
];

export default function PatientLoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState("email");
  const [value, setValue] = useState("");
  const [password, setPassword] = useState("");
  const [channel, setChannel] = useState("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res =
        method === "national_id"
          ? await patientLoginChooseChannel({ national_id: value, password, channel })
          : await patientLoginStart({ method, value, password });
      sessionStorage.setItem("uzima_pending_login", JSON.stringify({ method, value }));
      router.push(`/login/verify-otp?message=${encodeURIComponent(res.message)}`);
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
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Log in to your Uzima Link account</p>

          <div className={styles.roleSwitch}>
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMethod(m.value)}
                className={method === m.value ? styles.roleButtonActive : styles.roleButton}
              >
                {m.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              placeholder={method === "phone" ? "+254712345678" : method === "national_id" ? "National ID number" : "Email"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={styles.input}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />

            {method === "national_id" && (
              <select className={styles.input} value={channel} onChange={(e) => setChannel(e.target.value)}>
                <option value="email">Send code to email</option>
                <option value="phone">Send code to phone</option>
              </select>
            )}

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? "Sending code..." : "Continue"}
            </button>
          </form>

          <p className={styles.footer}>
            <Link href="/forgot-password" className={styles.link}>Forgot your password?</Link>
          </p>
          <p className={styles.footer}>
            Don&apos;t have an account? <Link href="/register" className={styles.link}>Create one</Link>
          </p>
          <p className={styles.footer}>
            <Link href="/login/staff" className={styles.link}>Doctor or frontdesk staff? Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}