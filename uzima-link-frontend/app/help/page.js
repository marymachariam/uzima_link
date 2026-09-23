"use client";

import { useState } from "react";
import { Mail, Phone, HelpCircle, ChevronDown, ChevronUp, LifeBuoy } from "lucide-react";
import styles from "./page.module.css";

const SUPPORT_EMAIL = "maryymachariam@gmail.com"; 
const SUPPORT_PHONE = "+254 797488020";      

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      question: "Forgot your password?",
      answer: "Use the \"Forgot your password?\" link on the sign-in screen to securely reset your credentials via email."
    },
    {
      question: "Didn't get your verification code?",
      answer: "Check your spam or junk folder. Alternatively, go back and sign in again to trigger and request a new verification code."
    }
  ];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerSection}>
        <div className={styles.headerIconWrapper}>
          <LifeBuoy size={24} className={styles.headerMainIcon} />
        </div>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Help & Support</h1>
          <p className={styles.subtitle}>Need a hand, or something not working right? Reach us directly.</p>
        </div>
      </div>

      <div className={styles.contentGrid}>
        {/* Contact Support Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIconWrap}>
              <HelpCircle size={18} className={styles.cardIcon} />
            </div>
            <h3 className={styles.cardTitle}>Direct Contact</h3>
          </div>
          <p className={styles.cardDesc}>Our support team is available during standard operating hours.</p>
          
          <div className={styles.contactList}>
            <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.contactItem}>
              <div className={styles.itemIconWrap}>
                <Mail size={15} />
              </div>
              <div className={styles.itemDetails}>
                <span className={styles.itemLabel}>Email Support</span>
                <span className={styles.itemValue}>{SUPPORT_EMAIL}</span>
              </div>
            </a>

            <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`} className={styles.contactItem}>
              <div className={styles.itemIconWrap}>
                <Phone size={15} />
              </div>
              <div className={styles.itemDetails}>
                <span className={styles.itemLabel}>Phone Line</span>
                <span className={styles.itemValue}>{SUPPORT_PHONE}</span>
              </div>
            </a>
          </div>
        </div>

        {/* Common Questions / FAQ Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIconWrap}>
              <HelpCircle size={18} className={styles.cardIcon} />
            </div>
            <h3 className={styles.cardTitle}>Common Questions</h3>
          </div>
          <p className={styles.cardDesc}>Quick answers to frequent authentication issues.</p>

          <div className={styles.faqList}>
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index} 
                  className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ""}`}
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                >
                  <div className={styles.faqQuestionRow}>
                    <span className={styles.faqQuestionText}>{faq.question}</span>
                    {isOpen ? <ChevronUp size={16} className={styles.faqChevron} /> : <ChevronDown size={16} className={styles.faqChevron} />}
                  </div>
                  {isOpen && (
                    <p className={styles.faqAnswerText}>{faq.answer}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}