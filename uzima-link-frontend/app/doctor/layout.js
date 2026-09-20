"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import { getDoctorKycStatus } from "@/lib/endpoints";
import DoctorNav from "@/components/doctor/DoctorNav";
import styles from "../patient/layout.module.css";

export default function DoctorLayout({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login/staff");
      return;
    }
    getDoctorKycStatus()
      .then((res) => {
        if (!res.kyc_verified) router.replace("/doctor/kyc");
        else setChecking(false);
      })
      .catch(() => router.replace("/login/staff"));
  }, [router]);

  if (checking) return <div className={styles.loading}>Loading your account...</div>;

  return (
    <div className={styles.shell}>
      <DoctorNav />
      <main className={styles.content}>{children}</main>
    </div>
  );
}