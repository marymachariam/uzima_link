"use client";

import { useRouter, usePathname } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import styles from "@/app/doctor/layout.module.css";

function PatientShell({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: "My Dashboard", path: "/patient" },
    { label: "How I'm Feeling", path: "/patient/report" },
    { label: "My Allergies", path: "/patient/allergies" },
    { label: "My Profile", path: "/patient/profile" },
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
            <button key={item.path} onClick={() => router.push(item.path)}
              className={pathname === item.path ? styles.navItemActive : styles.navItem}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className={styles.footer}>
          <div className={styles.doctorInfo}>
            <div className={styles.doctorAvatar}>{user?.fullName?.[0]?.toUpperCase() || "P"}</div>
            <div>
              <div className={styles.doctorName}>{user?.fullName || "Patient"}</div>
            </div>
          </div>
          <button onClick={logout} className={styles.logoutLink}>Log out</button>
        </div>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
}

export default function PatientLayout({ children }) {
  return <AuthGuard allowedRoles={["patient"]}><PatientShell>{children}</PatientShell></AuthGuard>;
}