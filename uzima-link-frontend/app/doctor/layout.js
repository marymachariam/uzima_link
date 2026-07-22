"use client";

import { useRouter, usePathname } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import styles from "./layout.module.css";
import { useState, useEffect } from "react";
import { getRecentRegistrations } from "@/lib/endpoints";

function DoctorShell({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      setLoadingNotifs(true);
      try {
        const result = await getRecentRegistrations(5);
        setNotifications(result);
      } catch (err) {
        console.error("Failed to load notifications:", err.message);
      } finally {
        setLoadingNotifs(false);
      }
    }
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

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
              className={
                pathname === item.path ? styles.navItemActive : styles.navItem
              }
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className={styles.notifSection}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={styles.notifButton}
          >
            🔔 New patients
            {notifications.length > 0 && (
              <span className={styles.notifBadge}>{notifications.length}</span>
            )}
          </button>

          {showNotifications && (
            <div className={styles.notifDropdown}>
              {loadingNotifs ? (
                <p className={styles.notifEmpty}>Loading...</p>
              ) : notifications.length === 0 ? (
                <p className={styles.notifEmpty}>No recent registrations</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={styles.notifItem}>
                    <span className={styles.notifName}>{n.full_name}</span>
                    <span className={styles.notifTime}>
                      {new Date(n.created_at).toLocaleString([], {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.doctorInfo}>
            <div className={styles.doctorAvatar}>
              {user?.fullName?.[0]?.toUpperCase() || "D"}
            </div>
            <div>
              <div className={styles.doctorName}>
                {user?.fullName || "Doctor"}
              </div>
              <div className={styles.doctorFacility}>
                {user?.facilityName || ""}
              </div>
            </div>
          </div>
          <button onClick={logout} className={styles.logoutLink}>
            Log out
          </button>
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
