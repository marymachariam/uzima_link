"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth";
import styles from "./DoctorNav.module.css";
import { Menu, X } from "lucide-react";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/doctor", label: "Home", icon: HomeIcon, exact: true },
  { href: "/doctor/queue", label: "Queue", icon: QueueIcon },
  { href: "/doctor/scan", label: "Scan Patient", icon: ScanIcon, also: ["/doctor/consent", "/doctor/patients"] },
  { href: "/doctor/profile", label: "Profile", icon: UserIcon },
];

function isActive(item, pathname) {
  if (item.exact) return pathname === item.href;
  return [item.href, ...(item.also || [])].some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getPatientFlow(pathname) {
  const match = pathname.match(/^\/doctor\/(consent|patients)\/([^/]+)/);
  if (!match) return null;
  return {
    label: match[1] === "consent" ? "Patient consent" : "Patient record",
    uid: safeDecode(match[2]),
    href: match[0],
  };
}

export default function DoctorNav() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const flow = getPatientFlow(pathname);

  function handleLogout() {
    clearSession();
    router.push("/login/staff");
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className={styles.sidebar}>
        <div className={styles.brand}>
          <div>
              <span className={styles.brandTitle}>
              <Image
                src="/logo1.png"
                alt="Uzima Link"
                width={200}
                height={200}
                className={styles.brandLogo}
                priority
              />
            </span>
            <span className={styles.brandSubtitle}>Doctor Portal</span>
          </div>
        </div>

        <div className={styles.links}>
          {NAV_ITEMS.map((item) => {
            const { href, label, icon: Icon } = item;
            const active = isActive(item, pathname);
            return (
              <Fragment key={href}>
                <Link href={href} className={`${styles.link} ${active ? styles.linkActive : ""}`}>
                  <Icon />
                  <span>{label}</span>
                </Link>
                {href === "/doctor/scan" && flow && (
                  <Link href={flow.href} className={styles.subLink}>
                    <span className={styles.subLabel}>{flow.label}</span>
                    <span className={styles.subUid}>{flow.uid}</span>
                  </Link>
                )}
              </Fragment>
            );
          })}
        </div>

        <button onClick={handleLogout} className={styles.logout}>
          <LogoutIcon />
          <span>Log out</span>
        </button>
      </nav>

      {/* Mobile Top Bar */}
      <div className={styles.mobileTopBar}>
        <div className={styles.mobileBrand}>
          <div className={styles.brandDotSmall} />
          <span className={styles.mobileBrandTitle}>Uzima Link Doctor</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className={styles.menuToggleButton}
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Full-Screen Slide-out Drawer */}
      {mobileMenuOpen && (
        <div className={styles.mobileDrawerOverlay} onClick={() => setMobileMenuOpen(false)}>
          <div className={styles.mobileDrawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>Doctor Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.drawerLinks}>
              {NAV_ITEMS.map((item) => {
                const { href, label, icon: Icon } = item;
                const active = isActive(item, pathname);
                return (
                  <Fragment key={href}>
                    <Link 
                      href={href} 
                      onClick={() => setMobileMenuOpen(false)}
                      className={`${styles.drawerLink} ${active ? styles.drawerLinkActive : ""}`}
                    >
                      <Icon />
                      <span>{label}</span>
                    </Link>
                    {href === "/doctor/scan" && flow && (
                      <Link 
                        href={flow.href} 
                        onClick={() => setMobileMenuOpen(false)}
                        className={styles.subLink}
                      >
                        <span className={styles.subLabel}>{flow.label}</span>
                        <span className={styles.subUid}>{flow.uid}</span>
                      </Link>
                    )}
                  </Fragment>
                );
              })}
            </div>
            <div className={styles.drawerFooter}>
              <button onClick={handleLogout} className={styles.logout}>
                <LogoutIcon />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Bar */}
      <nav className={styles.bottomBar}>
        {NAV_ITEMS.map((item) => {
          const { href, label, icon: Icon } = item;
          const active = isActive(item, pathname);
          return (
            <Link key={href} href={href} className={`${styles.bottomLink} ${active ? styles.bottomLinkActive : ""}`}>
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
function QueueIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><path d="M17 3.13a4 4 0 0 1 0 7.75"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg>;
}
function ScanIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>;
}
function UserIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function LogoutIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}