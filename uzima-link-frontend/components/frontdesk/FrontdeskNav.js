"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth";
import styles from "./FrontdeskNav.module.css";

const NAV_ITEMS = [
  { href: "/frontdesk", label: "Home", icon: HomeIcon },
  { href: "/frontdesk/patients", label: "Patients", icon: PatientsIcon },
  { href: "/frontdesk/queue", label: "Queue", icon: QueueIcon },
  { href: "/frontdesk/profile", label: "Profile", icon: UserIcon },
];

export default function FrontdeskNav() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearSession();
    router.push("/login/staff");
  }

  return (
    <>
      <nav className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandIconWrap}>
            <div className={styles.brandDot} />
          </div>
          <div className={styles.brandTextWrap}>
            <span className={styles.brandTitle}>Uzima Link</span>
            <span className={styles.brandSubtitle}>Frontdesk Portal</span>
          </div>
        </div>

        <div className={styles.linksSection}>
          <p className={styles.navCategory}>Main Menu</p>
          <div className={styles.links}>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link 
                  key={href} 
                  href={href} 
                  className={`${styles.link} ${active ? styles.linkActive : ""}`}
                >
                  <Icon />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className={styles.footerSection}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <LogoutIcon />
            <span>Log out</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className={styles.bottomBar}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link 
              key={href} 
              href={href} 
              className={`${styles.bottomLink} ${active ? styles.bottomLinkActive : ""}`}
            >
              <Icon />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function HomeIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>;
}
function PatientsIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>;
}
function QueueIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><path d="M17 3.13a4 4 0 0 1 0 7.75"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg>;
}
function UserIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function LogoutIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}