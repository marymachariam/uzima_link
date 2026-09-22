"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyEmail, resendVerificationEmail } from "@/lib/endpoints";
import styles from "../(auth)/auth.module.css";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing a token.");
      return;
    }
    verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message);
      });
  }, [token]);

  async function handleResend(e) {
    e.preventDefault();
    setResendLoading(true);
    try {
      await resendVerificationEmail(resendEmail);
      setResendSent(true);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setResendLoading(false);
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
          <h1 className={styles.title}>Email verification</h1>

          {status === "loading" && <p className={styles.subtitle}>Verifying your email...</p>}
          {status === "success" && <p className={styles.success}>{message}</p>}

          {status === "error" && (
            <>
              <p className={styles.error}>{message}</p>

              {resendSent ? (
                <p className={styles.success}>
                  If that email is registered and not yet verified, a new link is on its way.
                </p>
              ) : (
                <form onSubmit={handleResend} className={styles.form}>
                  <p className={styles.subtitle}>Enter your email to get a new verification link.</p>
                  <input
                    type="email"
                    placeholder="Email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className={styles.input}
                    required
                  />
                  <button type="submit" disabled={resendLoading} className={styles.button}>
                    {resendLoading ? "Sending..." : "Resend verification email"}
                  </button>
                </form>
              )}
            </>
          )}

          {status !== "loading" && (
            <p className={styles.footer}>
              <Link href="/login" className={styles.link}>Continue to sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}