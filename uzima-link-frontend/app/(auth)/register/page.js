"use client";

import { useState } from "react";
import Link from "next/link";
import { registerPatient, registerDoctor, registerFrontdesk } from "@/lib/endpoints";
import styles from "../auth.module.css";

const ID_TYPES = [
  { value: "none", label: "I don't have one yet" },
  { value: "national_id", label: "National ID" },
  { value: "birth_certificate", label: "Birth Certificate" },
  { value: "alien_id", label: "Alien ID" },
  { value: "passport", label: "Passport" },
];

export default function RegisterPage() {
  const [role, setRole] = useState("patient");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  const [patientForm, setPatientForm] = useState({
    full_name: "", date_of_birth: "", gender: "", phone_number: "",
    id_type: "none", national_id: "", guardian_name: "", guardian_phone: "",
    email: "", password: "",
  });

  const [doctorForm, setDoctorForm] = useState({
    full_name: "", email: "", password: "", national_id: "", phone_number: "",
    facility_name: "", facility_registration_number: "",
  });

  const [frontdeskForm, setFrontdeskForm] = useState({
    full_name: "", email: "", password: "", invite_code: "",
  });

  async function handleSignUp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let res;
      if (role === "patient") {
        const payload = {
          ...patientForm,
          national_id: patientForm.national_id || undefined,
          guardian_name: patientForm.guardian_name || undefined,
          guardian_phone: patientForm.guardian_phone || undefined,
        };
        res = await registerPatient(payload);
      } else if (role === "doctor") {
        res = await registerDoctor(doctorForm);
      } else {
        res = await registerFrontdesk(frontdeskForm);
      }
      setDone(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
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
            <h1 className={styles.title}>Check your email</h1>
            <p className={styles.success}>{done.message}</p>
            {role !== "patient" && (
              <p className={styles.text}>
                After verifying your email, you&apos;ll need to complete identity verification before your account is approved.
              </p>
            )}
            <p className={styles.footer}>
              Already verified? <Link href={role === "patient" ? "/login" : "/login/staff"} className={styles.link}>Log in</Link>
            </p>
          </div>
        </div>
      </div>
    );
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
          <h1 className={styles.title}>Create an account</h1>
          <p className={styles.subtitle}>Choose your role to get started</p>

          <div className={styles.roleSwitch}>
            {["patient", "doctor", "kiosk_operator"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r === "kiosk_operator" ? "frontdesk" : r)}
                className={(r === "kiosk_operator" ? role === "frontdesk" : role === r) ? styles.roleButtonActive : styles.roleButton}
              >
                {r.replace("_", " ")}
              </button>
            ))}
          </div>

          <form onSubmit={handleSignUp} className={styles.form}>
            {role === "patient" && (
              <>
                <input placeholder="Full name" value={patientForm.full_name}
                  onChange={(e) => setPatientForm((p) => ({ ...p, full_name: e.target.value }))}
                  className={styles.input} required />
                <input type="date" placeholder="Date of birth" value={patientForm.date_of_birth}
                  onChange={(e) => setPatientForm((p) => ({ ...p, date_of_birth: e.target.value }))}
                  className={styles.input} required />
                <select className={styles.input} value={patientForm.gender}
                  onChange={(e) => setPatientForm((p) => ({ ...p, gender: e.target.value }))} required>
                  <option value="" disabled>Gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
                <input placeholder="Phone number (+254...)" value={patientForm.phone_number}
                  onChange={(e) => setPatientForm((p) => ({ ...p, phone_number: e.target.value }))}
                  className={styles.input} required />
                <select className={styles.input} value={patientForm.id_type}
                  onChange={(e) => setPatientForm((p) => ({ ...p, id_type: e.target.value }))}>
                  {ID_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {patientForm.id_type !== "none" && (
                  <input placeholder="Document number" value={patientForm.national_id}
                    onChange={(e) => setPatientForm((p) => ({ ...p, national_id: e.target.value }))}
                    className={styles.input} required />
                )}
                <input placeholder="Guardian name (optional)" value={patientForm.guardian_name}
                  onChange={(e) => setPatientForm((p) => ({ ...p, guardian_name: e.target.value }))}
                  className={styles.input} />
                <input placeholder="Guardian phone (optional)" value={patientForm.guardian_phone}
                  onChange={(e) => setPatientForm((p) => ({ ...p, guardian_phone: e.target.value }))}
                  className={styles.input} />
                <input type="email" placeholder="Email" value={patientForm.email}
                  onChange={(e) => setPatientForm((p) => ({ ...p, email: e.target.value }))}
                  className={styles.input} required />
                <input type="password" placeholder="Password" value={patientForm.password}
                  onChange={(e) => setPatientForm((p) => ({ ...p, password: e.target.value }))}
                  className={styles.input} minLength={10} required />
              </>
            )}

            {role === "doctor" && (
              <>
                <input placeholder="Full name" value={doctorForm.full_name}
                  onChange={(e) => setDoctorForm((p) => ({ ...p, full_name: e.target.value }))}
                  className={styles.input} required />
                <input placeholder="National ID number" value={doctorForm.national_id}
                  onChange={(e) => setDoctorForm((p) => ({ ...p, national_id: e.target.value }))}
                  className={styles.input} required />
                <input placeholder="Phone number (+254...)" value={doctorForm.phone_number}
                  onChange={(e) => setDoctorForm((p) => ({ ...p, phone_number: e.target.value }))}
                  className={styles.input} required />
                <input placeholder="Facility name" value={doctorForm.facility_name}
                  onChange={(e) => setDoctorForm((p) => ({ ...p, facility_name: e.target.value }))}
                  className={styles.input} required />
                <input placeholder="Facility PPB registration number" value={doctorForm.facility_registration_number}
                  onChange={(e) => setDoctorForm((p) => ({ ...p, facility_registration_number: e.target.value }))}
                  className={styles.input} required />
                <input type="email" placeholder="Email" value={doctorForm.email}
                  onChange={(e) => setDoctorForm((p) => ({ ...p, email: e.target.value }))}
                  className={styles.input} required />
                <input type="password" placeholder="Password" value={doctorForm.password}
                  onChange={(e) => setDoctorForm((p) => ({ ...p, password: e.target.value }))}
                  className={styles.input} minLength={10} required />
              </>
            )}

            {role === "frontdesk" && (
              <>
                <input placeholder="Full name" value={frontdeskForm.full_name}
                  onChange={(e) => setFrontdeskForm((p) => ({ ...p, full_name: e.target.value }))}
                  className={styles.input} required />
                <input type="email" placeholder="Email" value={frontdeskForm.email}
                  onChange={(e) => setFrontdeskForm((p) => ({ ...p, email: e.target.value }))}
                  className={styles.input} required />
                <input type="password" placeholder="Password" value={frontdeskForm.password}
                  onChange={(e) => setFrontdeskForm((p) => ({ ...p, password: e.target.value }))}
                  className={styles.input} minLength={10} required />
                <input placeholder="Facility invite code" value={frontdeskForm.invite_code}
                  onChange={(e) => setFrontdeskForm((p) => ({ ...p, invite_code: e.target.value }))}
                  className={styles.input} required />
              </>
            )}

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className={styles.footer}>
            Already have an account? <Link href={role === "patient" ? "/login" : "/login/staff"} className={styles.link}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}