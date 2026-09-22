"use client";

import { useEffect, useState } from "react";
import { getFrontdeskQueue } from "@/lib/endpoints";
import styles from "./page.module.css";

export default function KioskQueuePage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getFrontdeskQueue()
      .then(setQueue)
      .catch(() => setQueue([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredQueue = queue.filter((entry) => {
    const matchesFilter = filter === "all" || entry.status === filter;
    const matchesSearch = (entry.patient_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const waitingCount = queue.filter(e => e.status === "waiting").length;
  const inProgressCount = queue.filter(e => e.status === "in_progress").length;

  return (
    <div className={styles.pageContainer}>
      {/* Header & Stats Overview */}
      <div className={styles.headerSection}>
        <div>
          <h1 className={styles.title}>Facility Queue</h1>
          <p className={styles.subtitle}>Real-time monitoring of patients checked in at your desk.</p>
        </div>
        <div className={styles.statsSummary}>
          <div className={styles.statBadge}>
            <span className={styles.dotWaiting}></span>
            <span>{waitingCount} Waiting</span>
          </div>
          <div className={styles.statBadge}>
            <span className={styles.dotProgress}></span>
            <span>{inProgressCount} In Progress</span>
          </div>
        </div>
      </div>

      {/* Toolbar: Filter Tabs & Search */}
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          <button 
            onClick={() => setFilter("all")} 
            className={filter === "all" ? styles.tabActive : styles.tab}
          >
            All ({queue.length})
          </button>
          <button 
            onClick={() => setFilter("waiting")} 
            className={filter === "waiting" ? styles.tabActive : styles.tab}
          >
            Waiting
          </button>
          <button 
            onClick={() => setFilter("in_progress")} 
            className={filter === "in_progress" ? styles.tabActive : styles.tab}
          >
            In Progress
          </button>
        </div>

        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Filter queue by patient name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className={styles.centerBox}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading live queue...</p>
        </div>
      ) : filteredQueue.length === 0 ? (
        <div className={styles.emptyStateCard}>
          <span className={styles.emptyIcon}>📋</span>
          <p className={styles.emptyTitle}>No queue records found</p>
          <p className={styles.emptyDesc}>
            {queue.length === 0 ? "No one is checked into the facility right now." : "No patients match your active filter or search."}
          </p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div className={styles.th}>Patient Name</div>
            <div className={styles.th}>Current Status</div>
            <div className={styles.th}>Check-in Time</div>
            <div className={styles.thRight}>Actions</div>
          </div>
          <div className={styles.tableBody}>
            {filteredQueue.map((entry) => (
              <div key={entry.id} className={styles.tableRow}>
                <div className={styles.td}>
                  <div className={styles.patientInfo}>
                    <div className={styles.avatar}>
                      {(entry.patient_name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className={styles.patientName}>{entry.patient_name || "Unknown patient"}</span>
                      <span className={styles.patientId}>ID: {entry.patient_system_uid || entry.id?.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.td}>
                  <span className={`${styles.statusBadge} ${styles[`status_${entry.status}`]}`}>
                    <span className={styles.statusDot}></span>
                    {entry.status ? entry.status.replace(/_/g, " ") : "unknown"}
                  </span>
                </div>
                <div className={styles.td}>
                  <span className={styles.timeText}>
                    {entry.created_at ? new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                  </span>
                </div>
                <div className={styles.tdRight}>
                  <span className={styles.actionNote}>Active Session</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}