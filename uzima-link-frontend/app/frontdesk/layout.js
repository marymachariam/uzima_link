"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import FrontdeskNav from "@/components/frontdesk/FrontdeskNav";
import styles from "../patient/layout.module.css";

export default function KioskLayout({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login/staff");
      return;
    }
    setChecking(false);
  }, [router]);

  if (checking) return <div className={styles.loading}>Loading your account...</div>;

  return (
    <div className={styles.shell}>
      <FrontdeskNav />
      <main className={styles.content}>{children}</main>
    </div>
  );
}