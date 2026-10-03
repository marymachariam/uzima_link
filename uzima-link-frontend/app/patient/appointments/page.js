"use client";

import { useEffect, useState } from "react";
import {
  getBookableFacilities,
  getBookableDoctors,
  getDoctorOpenSlots,
  bookAppointment,
  getMyAppointments,
  cancelMyAppointment,
} from "@/lib/endpoints";
import { toDate, formatDay, formatTime } from "@/lib/appointmentTime";
import styles from "./page.module.css";
import {
  CalendarDays,
  Building2,
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function AppointmentsPage() {
  const [tab, setTab] = useState("book"); // "book" | "mine"
  const [facilities, setFacilities] = useState([]);
  const [facilityId, setFacilityId] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadInitial() {
    setLoading(true);
    setError("");
    try {
      const [f, a] = await Promise.all([
        getBookableFacilities().catch(() => []),
        getMyAppointments().catch(() => []),
      ]);
      setFacilities(Array.isArray(f) ? f : []);
      setAppointments(Array.isArray(a) ? a : []);
    } catch (err) {
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitial();
  }, []);

  async function handleSelectFacility(id) {
    setFacilityId(id);
    setDoctor(null);
    setDoctors([]);
    setSlots([]);
    setSlot(null);
    setError("");
    if (!id) return;
    try {
      const list = await getBookableDoctors(id);
      setDoctors(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Could not load doctors.");
    }
  }

  async function handleSelectDoctor(d) {
    setDoctor(d);
    setSlot(null);
    setSlots([]);
    setError("");
    try {
      const list = await getDoctorOpenSlots(d.id);
      setSlots(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Could not load available slots.");
    }
  }

  async function handleBook() {
    if (!slot) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await bookAppointment(slot.id);
      setSuccess("Appointment booked successfully.");
      setSlot(null);
      setDoctor(null);
      setSlots([]);
      setDoctors([]);
      setFacilityId("");
      const a = await getMyAppointments();
      setAppointments(Array.isArray(a) ? a : []);
      setTab("mine");
    } catch (err) {
      setError(err.message || "Could not book this slot. It may have just been taken.");
      if (doctor) handleSelectDoctor(doctor); // refresh the slots
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel(id) {
    if (!confirm("Cancel this appointment?")) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await cancelMyAppointment(id);
      setSuccess("Appointment cancelled.");
      const a = await getMyAppointments();
      setAppointments(Array.isArray(a) ? a : []);
    } catch (err) {
      setError(err.message || "Failed to cancel appointment.");
    } finally {
      setBusy(false);
    }
  }

  // group open slots by day
  const slotsByDay = slots.reduce((acc, s) => {
    const key = toDate(s.start_time).toDateString();
    (acc[key] = acc[key] || []).push(s);
    return acc;
  }, {});

  const upcoming = appointments.filter((a) => a.status === "booked");
  const past = appointments.filter((a) => a.status !== "booked");

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div className={styles.headerBadge}>
          <CalendarDays size={14} /> Appointments
        </div>
        <h1 className={styles.title}>Book an Appointment</h1>
        <p className={styles.subtitle}>
          Choose a registered hospital and doctor, pick an open time, and
          you're booked.
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
          onClick={() => setTab("book")}
          className={`${styles.tabButton} ${tab === "book" ? styles.activeTab : ""}`}
        >
          <CalendarDays size={16} />
          <span>Book</span>
        </button>
        <button
          onClick={() => setTab("mine")}
          className={`${styles.tabButton} ${tab === "mine" ? styles.activeTab : ""}`}
        >
          <Clock size={16} />
          <span>My Appointments ({upcoming.length})</span>
        </button>
        <button onClick={loadInitial} className={styles.refreshButton} title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <span>Loading appointments...</span>
        </div>
      ) : tab === "book" ? (
        <div className={styles.section}>
          {/* Step 1: hospital */}
          <div className={styles.stepCard}>
            <h3 className={styles.stepTitle}>
              <Building2 size={16} /> 1. Choose a hospital
            </h3>
            {facilities.length === 0 ? (
              <p className={styles.mutedText}>
                No hospitals with available doctors are registered yet.
              </p>
            ) : (
              <select
                className={styles.select}
                value={facilityId}
                onChange={(e) => handleSelectFacility(e.target.value)}
              >
                <option value="">Select a hospital...</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                    {f.county ? ` — ${f.county}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Step 2: doctor */}
          {facilityId && (
            <div className={styles.stepCard}>
              <h3 className={styles.stepTitle}>
                <Stethoscope size={16} /> 2. Choose a doctor
              </h3>
              {doctors.length === 0 ? (
                <p className={styles.mutedText}>No doctors found at this hospital.</p>
              ) : (
                <div className={styles.doctorGrid}>
                  {doctors.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleSelectDoctor(d)}
                      className={`${styles.doctorCard} ${doctor?.id === d.id ? styles.selected : ""}`}
                    >
                      <span className={styles.doctorName}>
                        Dr. {d.full_name || "Unnamed"}
                      </span>
                      <span className={styles.doctorMeta}>
                        {d.specialty || "General practice"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: slot */}
          {doctor && (
            <div className={styles.stepCard}>
              <h3 className={styles.stepTitle}>
                <Clock size={16} /> 3. Pick a time
              </h3>
              {slots.length === 0 ? (
                <p className={styles.mutedText}>
                  This doctor has no open slots right now.
                </p>
              ) : (
                Object.entries(slotsByDay).map(([day, daySlots]) => (
                  <div key={day} className={styles.dayBlock}>
                    <div className={styles.dayLabel}>{formatDay(daySlots[0].start_time)}</div>
                    <div className={styles.slotRow}>
                      {daySlots.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSlot(s)}
                          className={`${styles.slotChip} ${slot?.id === s.id ? styles.selected : ""}`}
                        >
                          {formatTime(s.start_time)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Confirm */}
          {slot && doctor && (
            <div className={styles.confirmBar}>
              <div>
                <strong>Dr. {doctor.full_name}</strong> · {doctor.facility_name}
                <br />
                {formatDay(slot.start_time)} at {formatTime(slot.start_time)}
              </div>
              <button onClick={handleBook} disabled={busy} className={styles.primaryButton}>
                {busy ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.section}>
          {appointments.length === 0 ? (
            <div className={styles.emptyBox}>
              <CalendarDays size={40} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>No Appointments Yet</h3>
              <p className={styles.emptyText}>
                Book your first appointment from the Book tab.
              </p>
            </div>
          ) : (
            <>
              {[...upcoming, ...past].map((a) => (
                <div key={a.id} className={styles.apptCard}>
                  <div>
                    <h3 className={styles.apptTitle}>
                      Dr. {a.doctor_name || "Doctor"}
                      <span className={styles.apptSpecialty}>
                        {a.doctor_specialty ? ` · ${a.doctor_specialty}` : ""}
                      </span>
                    </h3>
                    <p className={styles.apptMeta}>
                      <Building2 size={13} /> {a.facility_name || "Facility"}
                    </p>
                    <p className={styles.apptMeta}>
                      <Clock size={13} /> {formatDay(a.scheduled_time)} at{" "}
                      {formatTime(a.scheduled_time)}
                    </p>
                  </div>
                  <div className={styles.apptActions}>
                    <span className={`${styles.statusTag} ${styles[a.status] || ""}`}>
                      {a.status}
                    </span>
                    {a.status === "booked" && (
                      <button
                        onClick={() => handleCancel(a.id)}
                        disabled={busy}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}