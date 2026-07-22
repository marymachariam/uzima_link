"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { login as loginRequest } from "@/lib/endpoints";
import styles from "./login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginRequest(email, password);
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
        <h1 className={styles.title}>Log in</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className={styles.footer}>
          No account?{" "}
          <a href="/register" className={styles.link}>
            Register here
          </a>
        </p>
        <p className={styles.footer}>
          <a href="/forgot-password" className={styles.link}>
            Forgot your password?
          </a>
        </p>
      </div>
    </div>
  );
}
