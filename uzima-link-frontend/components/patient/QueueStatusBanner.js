"use client";

import { useEffect, useState } from "react";
import { getMyQueueStatus } from "@/lib/endpoints";
import styles from "./QueueStatusBanner.module.css";

const POLL_MS = 15000;

export default function QueueStatusBanner() {
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    let cancelled = false;

    function refresh() {
      getMyQueueStatus()
        .then((data) => {
          if (!cancelled) setEntry(data || null);
        })
        .catch(() => {});
    }

    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (!entry) return null;

  if (entry.status === "in_progress") {
    return (
      <div className={`${styles.banner} ${styles.inProgress}`}>
        You&apos;re being seen now.
      </div>
    );
  }

  return (
    <div className={styles.banner}>
      You&apos;re <strong>#{entry.position}</strong> in the queue.
    </div>
  );
}