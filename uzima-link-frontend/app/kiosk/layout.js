"use client";

import { useRouter, usePathname } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import styles from "./layout.module.css";

function KioskShell({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  function handleReset() {
    sessionStorage.removeItem("uzima_recent_lookups");
    router.push("/kiosk");
  }

  return (
    <div className={styles.shell}>
      <header className={styles.nav}>
        <div className={styles.brand}>
          <div className={styles.logoDot} />
          <span className={styles.brandName}>Uzima Link Kiosk</span>
        </div>

        <div className={styles.navActions}>
          {pathname !== "/kiosk" && (
            <button onClick={() => router.push("/kiosk")} className={styles.navLink}>
              ← Look up patient
            </button>
          )}
          <button onClick={handleReset} className={styles.navLink}>
            Reset session
          </button>
          <div className={styles.operator}>
            <div className={styles.operatorName}>{user?.fullName || "Front desk"}</div>
            <div className={styles.operatorMeta}>{user?.facilityName || ""}</div>
          </div>
          <button onClick={logout} className={styles.logoutLink}>Log out</button>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}

export default function KioskLayout({ children }) {
  return (
    <AuthGuard allowedRoles={["kiosk_operator", "doctor"]}>
      <KioskShell>{children}</KioskShell>
    </AuthGuard>
  );
}