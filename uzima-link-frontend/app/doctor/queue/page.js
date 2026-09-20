"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getDoctorQueue,
  startQueueConsultation,
  completeQueueConsultation,
} from "@/lib/endpoints";
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  CheckSquare, 
  UserSquare2,
  AlertCircle
} from "lucide-react";
import styles from "./page.module.css";

export default function DoctorQueuePage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    getDoctorQueue()
      .then(setQueue)
      .finally(() => setLoading(false));
  }

  async function handleStart(id) {
    setActingOn(id);
    try {
      await startQueueConsultation(id);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActingOn(null);
    }
  }

  async function handleComplete(id) {
    setActingOn(id);
    try {
      await completeQueueConsultation(id);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActingOn(null);
    }
  }

  // Calculate quick metrics for the header
  const waitingCount = queue.filter(q => q.status === "waiting").length;
  const inProgressCount = queue.filter(q => q.status === "in_progress").length;
  const completedCount = queue.filter(q => q.status === "completed").length;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Facility Queue</h1>
          <p className={styles.subtitle}>
            Manage patient flow and active consultations.
          </p>
        </div>
        
        {/* Quick Stats Bar */}
        <div className={styles.statsBar}>
          <div className={styles.statPill}>
            <Users className={styles.statIcon} size={18} />
            <span className={styles.statLabel}>Waiting</span>
            <span className={styles.statCount}>{waitingCount}</span>
          </div>
          <div className={`${styles.statPill} ${styles.statPillActive}`}>
            <Clock className={styles.statIconActive} size={18} />
            <span className={styles.statLabel}>In Progress</span>
            <span className={styles.statCount}>{inProgressCount}</span>
          </div>
          <div className={`${styles.statPill} ${styles.statPillSuccess}`}>
            <CheckCircle2 className={styles.statIconSuccess} size={18} />
            <span className={styles.statLabel}>Completed</span>
            <span className={styles.statCount}>{completedCount}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Fetching latest queue data...</p>
        </div>
      ) : queue.length === 0 ? (
        <div className={styles.emptyState}>
          <CheckCircle2 size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>All caught up!</h3>
          <p className={styles.emptyText}>There are no patients waiting in the queue right now.</p>
        </div>
      ) : (
        <div className={styles.queueGrid}>
          {queue.map((entry) => (
            <div key={entry.id} className={`${styles.card} ${styles[`card_${entry.status}`]}`}>
              
              <div className={styles.cardMain}>
                <div className={styles.avatarWrapper}>
                  <UserSquare2 size={24} className={styles.avatarIcon} />
                </div>
                
                <div className={styles.patientInfo}>
                  {entry.patient_system_uid ? (
                    <Link
                      href={`/doctor/scan/${entry.patient_system_uid}`}
                      className={styles.patientLink}
                    >
                      {entry.patient_name || "Unknown patient"}
                    </Link>
                  ) : (
                    <strong className={styles.patientName}>{entry.patient_name || "Unknown patient"}</strong>
                  )}
                  
                  <div className={styles.metaInfo}>
                    <span className={styles.timeInfo}>
                      <Clock size={14} className={styles.metaIcon} />
                      Checked in at {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {entry.patient_system_uid && (
                      <span className={styles.idInfo}>
                        ID: {entry.patient_system_uid.slice(0,8)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.cardActions}>
                <div className={styles.statusBadgeWrapper}>
                   <span className={`${styles.statusBadge} ${styles[`badge_${entry.status}`]}`}>
                    {entry.status === 'in_progress' && <span className={styles.pulsingDot}></span>}
                    {entry.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className={styles.buttonGroup}>
                  {entry.status === "waiting" && (
                    <button
                      onClick={() => handleStart(entry.id)}
                      disabled={actingOn === entry.id}
                      className={styles.startButton}
                    >
                      {actingOn === entry.id ? (
                         <span className={styles.buttonSpinner}></span>
                      ) : (
                        <>
                          <PlayCircle size={18} />
                          Start Consult
                        </>
                      )}
                    </button>
                  )}
                  {entry.status === "in_progress" && (
                    <button
                      onClick={() => handleComplete(entry.id)}
                      disabled={actingOn === entry.id}
                      className={styles.completeButton}
                    >
                       {actingOn === entry.id ? (
                         <span className={styles.buttonSpinnerDark}></span>
                      ) : (
                        <>
                          <CheckSquare size={18} />
                          Complete
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}