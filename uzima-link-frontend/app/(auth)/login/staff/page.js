"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginDoctor, loginFrontdesk, getDoctorKycStatus } from "@/lib/endpoints";
import { saveSession } from "@/lib/auth";
import styles from "../../auth.module.css";
import Image from "next/image";

export default function StaffLoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("doctor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
  e.preventDefault();
  setError("");
  setLoading(true);
  try {
    const res = role === "doctor" ? await loginDoctor(email, password) : await loginFrontdesk(email, password);
    sessionStorage.setItem("uzima_pending_staff_login", JSON.stringify({ role, email }));
    router.push(`/login/staff/verify-otp?message=${encodeURIComponent(res.message)}`);
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
          <h1 className={styles.title}>Staff sign in</h1>
          <p className={styles.subtitle}>For doctors and frontdesk operators</p>

          <div className={styles.roleSwitch}>
            {["doctor", "kiosk_operator"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r === "kiosk_operator" ? "frontdesk" : "doctor")}
                className={
                  (r === "doctor" ? role === "doctor" : role === "frontdesk")
                    ? styles.roleButtonActive
                    : styles.roleButton
                }
              >
                {r.replace("_", " ")}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={styles.input} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={styles.input} required />

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.25rem", width: "100%" }}>
            <Link href="/forgot-password" className={styles.link}>Forgot password?</Link>
            <Link href="/login" className={styles.link}>Patient? Sign in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}