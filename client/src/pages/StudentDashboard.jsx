import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import { checkIn, checkOut, fetchStudentDashboard } from "../services/libraryService";
import { getSocket } from "../services/socket";
import { formatCurrency, formatDateTime, formatHours } from "../utils/format";

const StudentDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceAction, setAttendanceAction] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      const dashboardData = await fetchStudentDashboard();
      setDashboard(dashboardData);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const socket = getSocket();
    socket.connect();
    socket.on("attendanceUpdated", loadDashboard);
    socket.on("paymentsUpdated", loadDashboard);

    return () => {
      socket.off("attendanceUpdated", loadDashboard);
      socket.off("paymentsUpdated", loadDashboard);
      socket.disconnect();
    };
  }, [loadDashboard]);

  const handleAttendance = async (action) => {
    setAttendanceAction(action);
    try {
      if (action === "in") {
        await checkIn();
        toast.success("Check-in successful");
      } else {
        await checkOut();
        toast.success("Check-out successful");
      }
      await loadDashboard();
    } catch (error) {
      toast.error(String(error));
    } finally {
      setAttendanceAction("");
    }
  };

  if (loading || !dashboard) {
    return (
      <DashboardLayout title="Home" subtitle="Loading your space…">
        <div className="flex min-h-[40vh] items-center justify-center rounded-[2rem] border border-slate-200/80 bg-white/80 font-display text-slate-500 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <p className="text-sm font-semibold">Syncing dashboard…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { student, activeBooking, activeAttendance, todayFaceAttendance, stats } = dashboard;

  return (
    <DashboardLayout
      title={`Hey, ${student.name?.split(" ")[0] || "scholar"}`}
      subtitle="Your library command center — seats, money, and minutes in one glow-up view."
    >
      <div className="font-display min-w-0 space-y-6 sm:space-y-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-[2rem] border border-indigo-500/20 bg-gradient-to-br from-indigo-950 via-slate-900 to-fuchsia-950 p-5 text-white shadow-2xl shadow-indigo-900/35 max-lg:ring-1 max-lg:ring-cyan-400/15 sm:p-8 md:p-10 lg:ring-0">
          <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-20 left-0 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" aria-hidden />
          <div className="relative grid min-w-0 gap-6 sm:gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-cyan-300/90">Library Hub</p>
              <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
                Study in style.
                <span className="block bg-gradient-to-r from-cyan-200 to-fuchsia-200 bg-clip-text text-transparent">
                  Track everything live.
                </span>
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-300">
                Book seats with Razorpay, mark face attendance when you arrive, and watch hours stack — no spreadsheet energy.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  to="/student/seats"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-white px-5 py-3 text-center text-sm font-bold text-slate-900 shadow-lg transition hover:bg-cyan-50"
                >
                  Book a seat →
                </Link>
                <Link
                  to="/student/mark-attendance"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-center text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  Mark Attendance
                </Link>
              </div>
            </div>
            <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-2">
              {[
                ["ID", student.studentId, "font-mono text-xs"],
                ["Visits", String(stats.totalVisits), ""],
                ["Hours", formatHours(stats.totalHours), ""],
                ["Penalty", "₹" + (stats.penalties ?? 0), "text-rose-300"],
                ["Payments", String(stats.totalPayments ?? 0), ""],
                ["Spent", formatCurrency(stats.totalSpent ?? 0), "text-cyan-200"],
              ].map(([label, val, extra]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md transition hover:border-white/20"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                  <p
                    className={
                      "mt-1 break-words text-base font-bold tabular-nums sm:text-lg " + (extra || "text-white")
                    }
                  >
                    {val}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Jump in</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Link
              to="/student/bookings"
              className="group relative min-h-0 overflow-hidden rounded-3xl border border-cyan-200/60 bg-gradient-to-br from-cyan-600 to-teal-800 p-5 text-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl max-lg:ring-1 max-lg:ring-white/20 max-lg:shadow-[0_12px_36px_-8px_rgba(0,0,0,0.38)] sm:p-6 lg:shadow-xl lg:ring-0"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-100/90">History</p>
              <h3 className="mt-2 text-xl font-bold">Bookings</h3>
              <p className="mt-2 text-sm text-cyan-100/85">All seat reservations & status</p>
              <span className="mt-4 inline-block text-sm font-bold group-hover:underline">Open →</span>
            </Link>
            <Link
              to="/student/payments"
              className="group relative min-h-0 overflow-hidden rounded-3xl border border-fuchsia-200/50 bg-gradient-to-br from-fuchsia-600 to-violet-900 p-5 text-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl max-lg:ring-1 max-lg:ring-white/20 max-lg:shadow-[0_12px_36px_-8px_rgba(0,0,0,0.38)] sm:p-6 lg:shadow-xl lg:ring-0"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-fuchsia-100/90">Wallet</p>
              <h3 className="mt-2 text-xl font-bold">Payments</h3>
              <p className="mt-2 text-sm text-fuchsia-100/85">Razorpay receipts & totals</p>
              <span className="mt-4 inline-block text-sm font-bold group-hover:underline">Open →</span>
            </Link>
            <Link
              to="/student/attendance"
              className="group relative min-h-0 overflow-hidden rounded-3xl border border-emerald-200/50 bg-gradient-to-br from-emerald-600 to-slate-900 p-5 text-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl max-lg:ring-1 max-lg:ring-white/20 max-lg:shadow-[0_12px_36px_-8px_rgba(0,0,0,0.38)] sm:p-6 lg:shadow-xl lg:ring-0"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-100/90">Sessions</p>
              <h3 className="mt-2 text-xl font-bold">Attendance</h3>
              <p className="mt-2 text-sm text-emerald-100/85">Check-in log & hours</p>
              <span className="mt-4 inline-block text-sm font-bold group-hover:underline">Open →</span>
            </Link>
            <Link
              to="/student/mark-attendance"
              className="group relative min-h-0 overflow-hidden rounded-3xl border border-indigo-200/50 bg-gradient-to-br from-indigo-600 to-slate-900 p-5 text-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl max-lg:ring-1 max-lg:ring-white/20 max-lg:shadow-[0_12px_36px_-8px_rgba(0,0,0,0.38)] sm:p-6 lg:shadow-xl lg:ring-0"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-100/90">Presence</p>
              <h3 className="mt-2 text-xl font-bold">Mark Attendance</h3>
              <p className="mt-2 text-sm text-indigo-100/85">Face recognition — camera &amp; registered photo</p>
              <span className="mt-4 inline-block text-sm font-bold group-hover:underline">Open →</span>
            </Link>
          </div>
        </div>

        {/* Attendance control */}
        <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 max-lg:border-indigo-100/40 max-lg:bg-gradient-to-b max-lg:from-white max-lg:to-slate-50/90 max-lg:shadow-lg lg:border-slate-200/80 lg:bg-white lg:from-white lg:to-white lg:shadow-xl">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/40 px-4 py-4 sm:px-6 sm:py-5 md:px-8">
            <h2 className="text-xl font-bold text-slate-900">Manual check-in / out</h2>
            <p className="mt-1 text-sm text-slate-500">
              Needs an active booking for check-in. Daily presence via face? Use{" "}
              <Link to="/student/mark-attendance" className="font-semibold text-indigo-600 underline">
                Mark Attendance
              </Link>
              .
            </p>
          </div>
          <div className="grid min-w-0 gap-4 p-4 sm:gap-6 sm:p-6 md:grid-cols-2 md:p-8 lg:grid-cols-3">
            <div className="flex flex-col justify-between rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-100 max-lg:bg-white max-lg:shadow-sm max-lg:shadow-slate-200/50 lg:bg-slate-50 lg:shadow-none">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Booking</p>
                {activeBooking ? (
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    <li>
                      <span className="font-semibold text-slate-900">{activeBooking.seat?.seatNumber}</span>
                    </li>
                    <li className="capitalize text-slate-600">Status: {activeBooking.status}</li>
                    <li className="text-slate-500">Ends {formatDateTime(activeBooking.endTime)}</li>
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">No active seat — book first.</p>
                )}
              </div>
              <Link to="/student/seats" className="mt-4 text-sm font-bold text-indigo-600 hover:underline">
                Go to seat booking →
              </Link>
            </div>
            <div className="flex flex-col justify-between rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-100 max-lg:bg-white max-lg:shadow-sm max-lg:shadow-slate-200/50 lg:bg-slate-50 lg:shadow-none">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Session</p>
                {activeAttendance ? (
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    <li>
                      <span className="font-semibold">{activeAttendance.seat?.seatNumber}</span>
                    </li>
                    <li>In at {formatDateTime(activeAttendance.checkInTime)}</li>
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Not checked in.</p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleAttendance("in")}
                  disabled={attendanceAction === "in" || !activeBooking || Boolean(activeAttendance)}
                  className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {attendanceAction === "in" ? "Checking in…" : "Check in"}
                </button>
                <button
                  type="button"
                  onClick={() => handleAttendance("out")}
                  disabled={attendanceAction === "out" || !activeAttendance}
                  className="flex-1 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {attendanceAction === "out" ? "Checking out…" : "Check out"}
                </button>
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-100 max-lg:bg-white max-lg:shadow-sm max-lg:shadow-slate-200/50 lg:col-span-1 lg:bg-slate-50 lg:shadow-none">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Face attendance</p>
                {!todayFaceAttendance ? (
                  <p className="mt-3 text-sm text-slate-600">No face check-in today yet.</p>
                ) : todayFaceAttendance.checkOutTime ? (
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    <li>
                      In <span className="font-semibold">{todayFaceAttendance.time}</span> · Out{" "}
                      <span className="font-semibold">{todayFaceAttendance.checkOutTime}</span>
                    </li>
                    <li className="text-slate-500">
                      Face hours:{" "}
                      <span className="font-semibold text-indigo-700">
                        {formatHours(todayFaceAttendance.totalFaceHours ?? 0)}
                      </span>
                    </li>
                  </ul>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    <li>
                      Checked in at <span className="font-semibold">{todayFaceAttendance.time}</span>
                    </li>
                    <li className="text-amber-800">Scan again on Mark Attendance to check out.</li>
                  </ul>
                )}
              </div>
              <Link to="/student/mark-attendance" className="mt-4 text-sm font-bold text-indigo-600 hover:underline">
                Open Mark Attendance →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
