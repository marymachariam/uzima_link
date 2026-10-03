"use client";

import { useEffect, useState } from "react";
import {
  getMySlots,
  createSlot,
  deleteSlot,
  getDoctorAppointments,
} from "@/lib/endpoints";
import { toDate, formatDay, formatTime } from "@/lib/appointmentTime";
import styles from "./page.module.css";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  User,
} from "lucide-react";

export default function DoctorAppointmentsPage() {
  const [tab, setTab] = useState("bookings"); // "bookings" | "slots"
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [date, setDate] = useState("");
  const [from, setFrom] = useState("09:00");
  const [to, setTo] = useState("12:00");
  const [duration, setDuration] = useState(30);

  async function loadData() {
    setLoading(true);
    try {
      const [a, s] = await Promise.all([
        getDoctorAppointments().catch(() => []),
        getMySlots().catch(() => []),
      ]);
      setAppointments(Array.isArray(a) ? a : []);
      setSlots(Array.isArray(s) ? s : []);
    } catch (err) {
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAddSlots(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!date) return setError("Pick a date first.");

    const start = new Date(`${date}T${from}`);
    const end = new Date(`${date}T${to}`);
    if (end <= start) return setError("End time must be after start time.");

    const step = Number(duration) * 60000;
    const toCreate = [];
    for (let t = start.getTime(); t + step <= end.getTime(); t += step) {
      if (t > Date.now()) toCreate.push([new Date(t), new Date(t + step)]);
    }
    if (toCreate.length === 0) {
      return setError("No future slots fit in that time range.");
    }

    setBusy(true);
    let created = 0;
    let skipped = 0;
    let lastError = "";
    for (const [slotStart, slotEnd] of toCreate) {
      try {
        await createSlot(slotStart.toISOString(), slotEnd.toISOString());
        created++;
      } catch (err) {
        skipped++;
        lastError = err.message || "";
      }
    }
    setBusy(false);

    if (created > 0) setSuccess(`${created} slot(s) added.`);
    if (skipped > 0) {
      setError(
        `${skipped} slot(s) skipped${lastError ? `: ${lastError}` : "."}`,
      );
    }
    await loadData();
    if (created > 0) setTab("slots");
  }

  async function handleDeleteSlot(id) {
    if (!confirm("Delete this slot?")) return;
    setError("");
    setSuccess("");
    try {
      await deleteSlot(id);
      setSuccess("Slot deleted.");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to delete slot.");
    }
  }

  const groupByDay = (items, key) =>
    items.reduce((acc, item) => {
      const day = toDate(item[key]).toDateString();
      (acc[day] = acc[day] || []).push(item);
      return acc;
    }, {});

  const bookingsByDay = groupByDay(appointments, "scheduled_time");
  const slotsByDay = groupByDay(slots, "start_time");

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div className={styles.headerBadge}>
          <CalendarDays size={14} /> Appointments
        </div>
        <h1 className={styles.title}>My Schedule</h1>
        <p className={styles.subtitle}>
          Publish your available times and see who has booked them.
        </p>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className={styles.successBox}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className={styles.tabContainer}>
        <button
          onClick={() => setTab("bookings")}
          className={`${styles.tabButton} ${tab === "bookings" ? styles.activeTab : ""}`}
        >
          <User size={16} />
          <span>Upcoming Bookings ({appointments.length})</span>
        </button>
        <button
          onClick={() => setTab("slots")}
          className={`${styles.tabButton} ${tab === "slots" ? styles.activeTab : ""}`}
        >
          <Clock size={16} />
          <span>My Slots ({slots.length})</span>
        </button>
        <button onClick={loadData} className={styles.refreshButton} title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <span>Loading schedule...</span>
        </div>
      ) : tab === "bookings" ? (
        <div className={styles.section}>
          {appointments.length === 0 ? (
            <div className={styles.emptyBox}>
              <CalendarDays size={40} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>No Upcoming Bookings</h3>
              <p className={styles.emptyText}>
                When patients book your open slots, they will appear here.
              </p>
            </div>
          ) : (
            Object.entries(bookingsByDay).map(([day, items]) => (
              <div key={day} className={styles.dayBlock}>
                <div className={styles.dayLabel}>
                  {formatDay(items[0].scheduled_time)}
                </div>
                {items.map((a) => (
                  <div key={a.id} className={styles.apptCard}>
                    <div>
                      <h3 className={styles.apptTitle}>
                        {a.patient_name || "Patient"}
                      </h3>
                      <p className={styles.apptMeta}>
                        <Clock size={13} /> {formatTime(a.scheduled_time)}
                        {a.end_time ? ` – ${formatTime(a.end_time)}` : ""}
                      </p>
                    </div>
                    <span className={`${styles.statusTag} ${styles[a.status] || ""}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className={styles.section}>
          <form onSubmit={handleAddSlots} className={styles.stepCard}>
            <h3 className={styles.stepTitle}>
              <Plus size={16} /> Add availability
            </h3>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.label}>Date</span>
                <input
                  type="date"
                  className={styles.input}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>From</span>
                <input
                  type="time"
                  className={styles.input}
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>To</span>
                <input
                  type="time"
                  className={styles.input}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Slot length</span>
                <select
                  className={styles.input}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </label>
            </div>
            <button type="submit" disabled={busy} className={styles.primaryButton}>
              {busy ? "Adding..." : "Add Slots"}
            </button>
          </form>

          {slots.length === 0 ? (
            <p className={styles.mutedText}>You have not published any slots yet.</p>
          ) : (
            Object.entries(slotsByDay).map(([day, items]) => (
              <div key={day} className={styles.stepCard}>
                <div className={styles.dayLabel}>{formatDay(items[0].start_time)}</div>
                <div className={styles.slotRow}>
                  {items.map((s) => (
                    <div
                      key={s.id}
                      className={`${styles.slotChip} ${s.is_booked ? styles.slotBooked : ""}`}
                    >
                      <span>{formatTime(s.start_time)}</span>
                      {s.is_booked ? (
                        <span className={styles.bookedText}>booked</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(s.id)}
                          className={styles.iconButton}
                          title="Delete slot"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}