"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import { getKycStatus } from "@/lib/endpoints";
import PatientNav from "@/components/patient/PatientNav";
import styles from "./layout.module.css";

export default function PatientLayout({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    getKycStatus()
      .then((res) => {
        if (!res.kyc_verified) router.replace("/kyc");
        else setChecking(false);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  if (checking) {
    return <div className={styles.loading}>Loading your account...</div>;
  }

  return (
    <div className={styles.shell}>
      <PatientNav />
      <main className={styles.content}>{children}</main>
    </div>
  );
}