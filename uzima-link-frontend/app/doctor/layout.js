"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth";
import styles from "./layout.module.css";

export default function DoctorLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    router.push("/login/staff");
  };

  const hideSidebarRoutes = ["/doctor/kyc"];
  const shouldHideSidebar = hideSidebarRoutes.includes(pathname);

  if (shouldHideSidebar) {
    return <main>{children}</main>;
  }

  const navItems = [
    { href: "/doctor", label: "Home", icon: "🏠" },
    { href: "/doctor/queue", label: "Queue", icon: "👥" },
    { href: "/doctor/scan", label: "Scan Patient", icon: "🔍" },
    { href: "/doctor/profile", label: "Profile", icon: "👤" },
  ];

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.brand}>
            <div className={styles.brandDot} />
            <span className={styles.brandName}>Uzima Link</span>
          </div>
          <span className={styles.roleBadge}>Doctor Portal</span>
        </div>

        <nav className={styles.navMenu}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.activeNavLink : ""}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarBottom}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <span className={styles.navIcon}>🚪</span>
            <span className={styles.navLabel}>Log out</span>
          </button>
        </div>
      </aside>
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>{children}</div>
      </main>
    </div>
  );
}