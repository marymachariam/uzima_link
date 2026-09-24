"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyDoctorLogin, verifyFrontdeskLogin, getDoctorKycStatus } from "@/lib/endpoints";
import { saveSession } from "@/lib/auth";
import styles from "../../../auth.module.css";
import { ShieldCheck, AlertCircle } from "lucide-react";
import Image from "next/image";

function StaffVerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message") || "Enter the verification code sent to your email.";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const pendingStaffStr = sessionStorage.getItem("uzima_pending_staff_login");

      if (!pendingStaffStr) {
        throw new Error("Staff session data not found. Please sign in again.");
      }

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
        router.push("/frontdesk");
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
        <p className={styles.leftCaption}>Secure verification for staff access.</p>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.card}>
          <div className={styles.iconHeader}>
            <ShieldCheck size={32} className={styles.brandIcon} />
          </div>
          <h1 className={styles.title}>Staff Verification</h1>
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

export default function StaffVerifyOtpPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem" }}>Loading...</div>}>
      <StaffVerifyOtpContent />
    </Suspense>
  );
}