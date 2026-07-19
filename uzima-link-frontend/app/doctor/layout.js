"use client";

import { useRouter, usePathname } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import styles from "./layout.module.css";

function DoctorShell({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
  { label: "Dashboard", path: "/doctor" },
  { label: "Patients", path: "/doctor/patients" },
  { label: "Allergy Alerts", path: "/doctor/alerts" },
  { label: "Notes", path: "/doctor/notes" },
];

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.logoDot} />
          <span className={styles.brandName}>Uzima Link</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={pathname === item.path ? styles.navItemActive : styles.navItem}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.doctorInfo}>
            <div className={styles.doctorAvatar}>
              {user?.fullName?.[0]?.toUpperCase() || "D"}
            </div>
            <div>
              <div className={styles.doctorName}>{user?.fullName || "Doctor"}</div>
              <div className={styles.doctorFacility}>{user?.facilityName || ""}</div>
            </div>
          </div>
          <button onClick={logout} className={styles.logoutLink}>Log out</button>
        </div>
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
}

export default function DoctorLayout({ children }) {
  return (
    <AuthGuard allowedRoles={["doctor", "kiosk_operator"]}>
      <DoctorShell>{children}</DoctorShell>
    </AuthGuard>
  );
}