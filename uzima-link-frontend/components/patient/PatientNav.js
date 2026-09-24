"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth";
import styles from "./PatientNav.module.css";
import Image from "next/image";
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Pill,
  CreditCard,
  FileText,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/patient", label: "Home", icon: LayoutDashboard },
  { href: "/patient/symptoms", label: "Symptoms", icon: Activity },
  { href: "/patient/allergies", label: "Allergies", icon: AlertTriangle },
  { href: "/patient/medicine", label: "Medicine", icon: Pill },
  { href: "/patient/health-card", label: "Health Card", icon: CreditCard },
  { href: "/patient/prescriptions", label: "Prescriptions", icon: FileText },
  { href: "/patient/consent", label: "Consent", icon: ShieldCheck },
  { href: "/patient/profile", label: "Profile", icon: User },
];

export default function PatientNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brandContainer}>
          <div className={styles.brandText}>
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
            <span className={styles.brandSubtitle}>Patient Portal</span>
          </div>
        </div>

        <div className={styles.navCategory}>Menu</div>

        <div className={styles.links}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.link} ${active ? styles.linkActive : ""}`}
              >
                <Icon size={20} className={styles.linkIcon} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logout}>
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className={styles.mobileTopBar}>
        <div className={styles.mobileBrand}>
          <div className={styles.brandLogoSmall}>
            <div className={styles.brandDotSmall} />
          </div>
          <span className={styles.mobileBrandTitle}>Uzima Link</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={styles.menuToggleButton}
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Full-Screen Slide-out Drawer (Holds all 8 links + Logout) */}
      {mobileMenuOpen && (
        <div
          className={styles.mobileDrawerOverlay}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className={styles.mobileDrawer}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>All Menu Options</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className={styles.closeButton}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.drawerLinks}>
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`${styles.drawerLink} ${active ? styles.drawerLinkActive : ""}`}
                  >
                    <Icon size={20} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
            <div className={styles.drawerFooter}>
              <button onClick={handleLogout} className={styles.logout}>
                <LogOut size={18} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <nav className={styles.bottomBar}>
        {NAV_ITEMS.slice(0, 4).map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.bottomLink} ${active ? styles.bottomLinkActive : ""}`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={styles.bottomLink}
        >
          <Menu size={20} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
