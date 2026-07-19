"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { registerPatient, registerStaff } from "@/lib/endpoints";
import styles from "./register.module.css";

export default function RegisterPage() {
  const [role, setRole] = useState("patient");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const [patientForm, setPatientForm] = useState({
    full_name: "", date_of_birth: "", gender: "", phone_number: "",
    national_id: "", email: "", password: "",
  });

  const [staffForm, setStaffForm] = useState({
    full_name: "", email: "", password: "", invite_code: "",
  });

  function updatePatientField(field, value) {
    setPatientForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateStaffField(field, value) {
    setStaffForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
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

      if (response.role === "patient") router.push("/patient");
      else if (response.role === "doctor") router.push("/doctor");
      else router.push("/kiosk");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create an account</h1>

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

        <form onSubmit={handleSubmit} className={styles.form}>
          {role === "patient" ? (
            <>
              <input placeholder="Full name" value={patientForm.full_name}
                onChange={(e) => updatePatientField("full_name", e.target.value)}
                className={styles.input} required />
              <input placeholder="Date of birth (DD-MM-YYYY)" value={patientForm.date_of_birth}
                onChange={(e) => updatePatientField("date_of_birth", e.target.value)}
                className={styles.input} required />
              <input placeholder="Gender" value={patientForm.gender}
                onChange={(e) => updatePatientField("gender", e.target.value)}
                className={styles.input} required />
              <input placeholder="Phone number" value={patientForm.phone_number}
                onChange={(e) => updatePatientField("phone_number", e.target.value)}
                className={styles.input} />
              <input placeholder="National ID" value={patientForm.national_id}
                onChange={(e) => updatePatientField("national_id", e.target.value)}
                className={styles.input} />
              <input type="email" placeholder="Email" value={patientForm.email}
                onChange={(e) => updatePatientField("email", e.target.value)}
                className={styles.input} required />
              <input type="password" placeholder="Password" value={patientForm.password}
                onChange={(e) => updatePatientField("password", e.target.value)}
                className={styles.input} required />
            </>
          ) : (
            <>
              <input placeholder="Full name" value={staffForm.full_name}
                onChange={(e) => updateStaffField("full_name", e.target.value)}
                className={styles.input} required />
              <input type="email" placeholder="Email" value={staffForm.email}
                onChange={(e) => updateStaffField("email", e.target.value)}
                className={styles.input} required />
              <input type="password" placeholder="Password" value={staffForm.password}
                onChange={(e) => updateStaffField("password", e.target.value)}
                className={styles.input} required />
              <input placeholder="Facility invite code" value={staffForm.invite_code}
                onChange={(e) => updateStaffField("invite_code", e.target.value)}
                className={styles.input} required />
            </>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}