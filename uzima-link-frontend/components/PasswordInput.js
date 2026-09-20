"use client";

import { useState } from "react";
import styles from "@/app/(auth)/auth.module.css";

export default function PasswordInput({ value, onChange, placeholder = "Password", ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.passwordWrapper}>
      <input
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={styles.input}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className={styles.togglePassword}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}