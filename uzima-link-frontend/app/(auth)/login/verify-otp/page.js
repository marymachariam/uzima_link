"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  verifyDoctorLogin,
  verifyFrontdeskLogin,
  getDoctorKycStatus,
  patientLoginVerify
} from "@/lib/endpoints";
import { saveSession } from "@/lib/auth";
import styles from "../../auth.module.css";
import { ShieldCheck, AlertCircle } from "lucide-react";

function UnifiedVerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message") || "Enter the verification code sent to your email or phone.";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const pendingStaffStr = sessionStorage.getItem("uzima_pending_staff_login");

      if (pendingStaffStr) {
        const { role, email } = JSON.parse(pendingStaffStr);
        let res;

        if (role === "doctor") {
          res = await verifyDoctorLogin(email, otp);
        } else {
          res = await verifyFrontdeskLogin(email, otp);
        }

        saveSession(res.access_token, role);
        sessionStorage.removeItem("uzima_pending_staff_login");

        if (role === "doctor") {
          try {
            const kyc = await getDoctorKycStatus();
            router.push(kyc?.kyc_verified ? "/doctor" : "/doctor/kyc");
          } catch {
            router.push("/doctor/kyc");
          }
        } else {
          router.push("/kiosk");
        }

      } else {
        const pendingLoginStr = sessionStorage.getItem("uzima_pending_login");

        if (!pendingLoginStr) {
          throw new Error("Patient session data not found. Please sign in again.");
        }

        const { method, value } = JSON.parse(pendingLoginStr);
        const res = await patientLoginVerify({ method, value, otp });

        saveSession(res.access_token, "patient");
        sessionStorage.removeItem("uzima_pending_login");

        router.push("/patient");
      }

    } catch (err) {
      setError(err.message || "Invalid or expired verification code.");
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
        <p className={styles.leftCaption}>Secure verification for your account.</p>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.card}>
          <div className={styles.iconHeader}>
            <ShieldCheck size={32} className={styles.brandIcon} />
          </div>
          <h1 className={styles.title}>Verify Code</h1>
          <p className={styles.subtitle}>{message}</p>

          <form onSubmit={handleVerify} className={styles.form}>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={styles.input}
              maxLength={6}
              required
            />

            {error && (
              <div className={styles.errorAlert}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? "Verifying..." : "Confirm & Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function UnifiedVerifyOtpPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem" }}>Loading...</div>}>
      <UnifiedVerifyOtpContent />
    </Suspense>
  );
}