import Link from "next/link";
import styles from "./page.module.css";

export default function LandingPage() {
  return (
    <div className={styles.hero}>
      <div className={styles.heroTop}>
        <h1 className={styles.logo}>
          Uzima<span className={styles.logoAccent}>Link</span>
        </h1>
        <p className={styles.tagline}>
          Stop repeating your medical history at every hospital visit.
          Uzima Link keeps your health record secure, portable, and instantly
          available wherever youre treated.
        </p>
      </div>

      <div className={styles.ctaRow}>
        <Link href="/login" className={styles.primaryButton}>Log in</Link>
        <Link href="/register" className={styles.secondaryButton}>Create an account</Link>
      </div>

      <div className={styles.featureGrid}>
        <FeatureCard
          title="Speak naturally"
          description="Tell us how you're feeling in your own words typed or spoken, in any language. No forms, no checkboxes."
        />
        <FeatureCard
          title="AI-structured records"
          description="Your words are automatically translated and organized into symptoms, conditions, and medications for your doctor."
        />
        <FeatureCard
          title="Works everywhere"
          description="Your history follows you across any participating hospital or clinic  no more starting from zero."
        />
      </div>

      <div className={styles.howItWorks}>
        <h2 className={styles.howItWorksTitle}>How it works</h2>
        <div className={styles.stepsGrid}>
          <Step number="1" text="Check in at a kiosk with your phone number or ID" />
          <Step number="2" text="Describe how you're feeling, by typing or speaking" />
          <Step number="3" text="Your doctor instantly sees your symptoms and full history" />
          <Step number="4" text="Your record follows you to any other facility" />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description }) {
  return (
    <div className={styles.featureCard}>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureText}>{description}</p>
    </div>
  );
}

function Step({ number, text }) {
  return (
    <div className={styles.step}>
      <div className={styles.stepNumber}>{number}</div>
      <p className={styles.stepText}>{text}</p>
    </div>
  );
}