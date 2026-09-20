import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";
import styles from "./page.module.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export default function LandingPage() {
  return (
    <main className={`${styles.page} ${fraunces.variable} ${inter.variable}`}>
      {/* Navbar Header */}
      <header className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link href="/" className={styles.brandLogo}>
            <span className={styles.logoIcon}>+</span> Uzima Link
          </Link>
          <div className={styles.navActions}>
            <Link href="/login" className={styles.navLogin}>
              Log in
            </Link>
            <Link href="/register" className={styles.navRegister}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.heroBadge}>
            <span className={styles.pulseDot} /> Secure National Health Network
          </div>
          <h1 className={styles.headline}>
            Stop repeating your medical history at every hospital visit.
          </h1>
          <p className={styles.subhead}>
            Uzima Link keeps your health record secure, portable, and instantly
            available wherever you&apos;re treated, in the language you speak.
          </p>
          <div className={styles.ctaRow}>
            <Link href="/register" className={styles.primaryButton}>
              Create free account
            </Link>
            <Link href="/login" className={styles.secondaryButton}>
              Sign in to portal
            </Link>
          </div>
          <div className={styles.trustBanner}>
            <div className={styles.trustIcons}>🏥</div>
            <p className={styles.trustLine}>
              Trusted and connected across <strong>12,000+</strong> health facilities in Kenya
            </p>
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.demoPanel}>
            <div className={styles.demoHeader}>
              <span className={styles.liveIndicator} /> Live AI Translation Demo
            </div>
            <div className={styles.demoBubbleIncoming}>
              <span className={styles.demoLabel}>Patient says (Swahili)</span>
              <p>&ldquo;Nimekuwa na maumivu ya kichwa na homa tangu jana.&rdquo;</p>
            </div>
            <div className={styles.demoArrowContainer}>
              <div className={styles.demoArrowLine} />
              <span className={styles.demoArrowBadge}>Instant AI Structured</span>
              <div className={styles.demoArrowLine} />
            </div>
            <div className={styles.demoStructured}>
              <span className={styles.demoLabel}>Your doctor sees instantly</span>
              <div className={styles.demoRow}>
                <span className={styles.demoTag}>Symptoms</span>
                <span className={styles.demoValue}>Headache, Fever</span>
              </div>
              <div className={styles.demoRow}>
                <span className={styles.demoTag}>Duration</span>
                <span className={styles.demoValue}>Since yesterday</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionSubTag}>Seamless Workflow</span>
          <h2 className={styles.sectionTitle}>How Uzima Link works for you</h2>
          <p className={styles.sectionDesc}>Get set up in under 2 minutes and carry your history securely everywhere.</p>
        </div>
        <div className={styles.stepsGrid}>
          <Step 
            number="1" 
            title="Quick Sign Up"
            text="Register safely using your phone number and email address." 
          />
          <Step 
            number="2" 
            title="Secure Verification"
            text="Verify your email and log in securely with instant one-time codes." 
          />
          <Step 
            number="3" 
            title="Speak Naturally"
            text="Describe how you're feeling by voice or text, in your preferred local language." 
          />
          <Step 
            number="4" 
            title="Instant Access"
            text="Your doctor accesses your full verified medical history instantly at any facility." 
          />
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionSubTag}>Built for Patients & Doctors</span>
          <h2 className={styles.sectionTitle}>Designed for modern healthcare mobility</h2>
        </div>
        <div className={styles.featureGrid}>
          <FeatureCard
            icon="🗣️"
            title="Speak naturally"
            description="Tell us how you're feeling in your own words  typed or spoken, in any language. Your words are automatically translated and organized into symptoms, conditions, and medications your doctor can act on immediately."
          />
          <FeatureCard
            icon="🪪"
            title="A health card that travels with you"
            description="Download a digital health card with a secure scannable code. Any doctor at any participating facility can pull up your history safely in seconds."
          />
          <FeatureCard
            icon="💊"
            title="Know what you're taking"
            description="Check any medicine by name before you take it, and see plain-language safety info sourced directly from verified medical databases."
          />
          <FeatureCard
            icon="🔒"
            title="You control your record"
            description="Your identity is verified once, and every facility must request explicit permission before viewing your history. Nothing is ever shared without your consent."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <span className={styles.logoIcon}>+</span> Uzima Link
          </div>
          <p className={styles.footerText}>
            Are you a healthcare provider?{" "}
            <Link href="/login/staff" className={styles.footerLink}>
              Staff portal sign in &rarr;
            </Link>
          </p>
          <p className={styles.copyright}>© {new Date().getFullYear()} Uzima Link. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

function Step({ number, title, text }) {
  return (
    <div className={styles.stepCard}>
      <div className={styles.stepHeaderRow}>
        <div className={styles.stepNumber}>{number}</div>
      </div>
      <h3 className={styles.stepCardTitle}>{title}</h3>
      <p className={styles.stepText}>{text}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIconBox}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureText}>{description}</p>
    </div>
  );
}