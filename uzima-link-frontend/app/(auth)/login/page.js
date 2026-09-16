"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { login as loginRequest, registerPatient, registerStaff } from "@/lib/endpoints";
import styles from "../auth.module.css";

export default function AuthPage() {
  const [tab, setTab] = useState("signin"); 
  const [role, setRole] = useState("patient");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [patientForm, setPatientForm] = useState({
    full_name: "", date_of_birth: "", gender: "", phone_number: "",
    national_id: "", email: "", password: "",
  });
  const [staffForm, setStaffForm] = useState({
    full_name: "", email: "", password: "", invite_code: "",
  });

  function redirectByRole(userRole) {
    if (userRole === "patient") router.push("/patient");
    else if (userRole === "doctor") router.push("/doctor");
    else router.push("/kiosk");
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await loginRequest(loginForm.email, loginForm.password);
      login(response.access_token, response.role);
      redirectByRole(response.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let response;
      if (role === "patient") {
        response = await registerPatient(patientForm);
      } else {
        response = await registerStaff({ ...staffForm, role });
      }
      login(response.access_token, response.role);
      redirectByRole(response.role);
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
        <p className={styles.leftCaption}>
          Your health record, wherever care finds you.
        </p>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.card}>
          <div className={styles.tabRow}>
            <button
              className={tab === "signup" ? styles.tabActive : styles.tab}
              onClick={() => { setTab("signup"); setError(""); }}
            >
              Sign Up
            </button>
            <button
              className={tab === "signin" ? styles.tabActive : styles.tab}
              onClick={() => { setTab("signin"); setError(""); }}
            >
              Sign In
            </button>
          </div>

          {tab === "signin" ? (
            <>
              <h1 className={styles.title}>Welcome back</h1>
              <p className={styles.subtitle}>Log in to your Uzima Link account</p>

              <form onSubmit={handleSignIn} className={styles.form}>
                <input type="email" placeholder="Email" value={loginForm.email}
                  onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                  className={styles.input} required />
                <input type="password" placeholder="Password" value={loginForm.password}
                  onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                  className={styles.input} required />

                {error && <p className={styles.error}>{error}</p>}

                <button type="submit" disabled={loading} className={styles.button}>
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <p className={styles.footer}>
                <a href="/forgot-password" className={styles.link}>Forgot your password?</a>
              </p>
            </>
          ) : (
            <>
              <h1 className={styles.title}>Create an account</h1>
              <p className={styles.subtitle}>Choose your role to get started</p>

              <div className={styles.roleSwitch}>
                {["patient", "doctor", "kiosk_operator"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={role === r ? styles.roleButtonActive : styles.roleButton}
                  >
                    {r.replace("_", " ")}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSignUp} className={styles.form}>
                {role === "patient" ? (
                  <>
                    <input placeholder="Full name" value={patientForm.full_name}
                      onChange={(e) => setPatientForm((p) => ({ ...p, full_name: e.target.value }))}
                      className={styles.input} required />
                    <input placeholder="Date of birth (DD-MM-YYYY)" value={patientForm.date_of_birth}
                      onChange={(e) => setPatientForm((p) => ({ ...p, date_of_birth: e.target.value }))}
                      className={styles.input} required />
                    <input placeholder="Gender" value={patientForm.gender}
                      onChange={(e) => setPatientForm((p) => ({ ...p, gender: e.target.value }))}
                      className={styles.input} required />
                    <input placeholder="Phone number" value={patientForm.phone_number}
                      onChange={(e) => setPatientForm((p) => ({ ...p, phone_number: e.target.value }))}
                      className={styles.input} />
                    <input placeholder="National ID" value={patientForm.national_id}
                      onChange={(e) => setPatientForm((p) => ({ ...p, national_id: e.target.value }))}
                      className={styles.input} />
                    <input type="email" placeholder="Email" value={patientForm.email}
                      onChange={(e) => setPatientForm((p) => ({ ...p, email: e.target.value }))}
                      className={styles.input} required />
                    <input type="password" placeholder="Password" value={patientForm.password}
                      onChange={(e) => setPatientForm((p) => ({ ...p, password: e.target.value }))}
                      className={styles.input} required />
                  </>
                ) : (
                  <>
                    <input placeholder="Full name" value={staffForm.full_name}
                      onChange={(e) => setStaffForm((p) => ({ ...p, full_name: e.target.value }))}
                      className={styles.input} required />
                    <input type="email" placeholder="Email" value={staffForm.email}
                      onChange={(e) => setStaffForm((p) => ({ ...p, email: e.target.value }))}
                      className={styles.input} required />
                    <input type="password" placeholder="Password" value={staffForm.password}
                      onChange={(e) => setStaffForm((p) => ({ ...p, password: e.target.value }))}
                      className={styles.input} required />
                    <input placeholder="Facility invite code" value={staffForm.invite_code}
                      onChange={(e) => setStaffForm((p) => ({ ...p, invite_code: e.target.value }))}
                      className={styles.input} required />
                  </>
                )}

                {error && <p className={styles.error}>{error}</p>}

                <button type="submit" disabled={loading} className={styles.button}>
                  {loading ? "Creating account..." : "Sign Up"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}