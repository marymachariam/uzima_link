"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyDoctorLogin, verifyFrontdeskLogin, getDoctorKycStatus } from "@/lib/endpoints";
import { saveSession } from "@/lib/auth";
import styles from "../../../auth.module.css";

export default function StaffVerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const infoMessage = searchParams.get("message");
  const [pending, setPending] = useState(null);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("uzima_pending_staff_login");
    if (!raw) {
      router.replace("/login/staff");
      return;
    }
    setPending(JSON.parse(raw));
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pending) return;
    setError("");
    setLoading(true);
    try {
      const res =
        pending.role === "doctor"
          ? await verifyDoctorLogin(pending.email, otp)
          : await verifyFrontdeskLogin(pending.email, otp);
      saveSession(res.access_token, res.role);
      sessionStorage.removeItem("uzima_pending_staff_login");

      if (pending.role === "doctor") {
        const kyc = await getDoctorKycStatus();
        router.push(kyc.kyc_verified ? "/doctor" : "/doctor/kyc");
      } else {
        router.push("/kiosk");
      }
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
          <h1 className={styles.title}>Enter your code</h1>
          <p className={styles.subtitle}>{infoMessage || "We sent a 6-digit code to your email."}</p>

          {error && <p className={styles.error}>{error}</p>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              className={styles.input}
              style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.5rem" }}
              required
            />
            <button type="submit" disabled={loading || otp.length !== 6} className={styles.button}>
              {loading ? "Verifying..." : "Verify and log in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}