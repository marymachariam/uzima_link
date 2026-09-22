"use client";

import Link from "next/navigation"; 
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth";
import styles from "./PatientNav.module.css";
import { 
  LayoutDashboard, 
  Activity, 
  AlertTriangle, 
  Pill, 
  CreditCard, 
  FileText, 
  ShieldCheck, 
  User, 
  LogOut 
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

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  return (
    <>
      <aside className={styles.sidebar}>
        <div className={styles.brandContainer}>
          <div className={styles.brandLogo}>
            <div className={styles.brandDot} />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Uzima Link</span>
            <span className={styles.brandSubtitle}>Patient Portal</span>
          </div>
        </div>

        <div className={styles.navCategory}>Menu</div>

        <div className={styles.links}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <a key={href} href={href} className={`${styles.link} ${active ? styles.linkActive : ""}`}>
                <Icon size={20} className={styles.linkIcon} />
                <span>{label}</span>
              </a>
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

      <nav className={styles.bottomBar}>
        {NAV_ITEMS.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <a key={href} href={href} className={`${styles.bottomLink} ${active ? styles.bottomLinkActive : ""}`}>
              <Icon size={20} />
              <span>{label}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
}