import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import { bulkCreateSeats, createSeat, fetchAdminDashboard, fetchBookings } from "../services/libraryService";
import { getSocket } from "../services/socket";
import { formatCurrency, formatTime } from "../utils/format";

const defaultSeatForm = { seatNumber: "", seatType: "Regular" };
const defaultBulkForm = { count: 100, seatType: "Regular", prefix: "S" };

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [seatForm, setSeatForm] = useState(defaultSeatForm);
  const [bulkForm, setBulkForm] = useState(defaultBulkForm);
  const [submitting, setSubmitting] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      const [dashboardResponse, bookingsResponse] = await Promise.all([fetchAdminDashboard(), fetchBookings()]);

      setDashboard(dashboardResponse);
      setBookings(bookingsResponse.bookings);
    } catch (error) {
      toast.error(String(error));
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const socket = getSocket();
    socket.connect();
    socket.on("seats:updated", loadDashboard);
    socket.on("attendanceUpdated", loadDashboard);
    socket.on("paymentsUpdated", loadDashboard);

    return () => {
      socket.off("seats:updated", loadDashboard);
      socket.off("attendanceUpdated", loadDashboard);
      socket.off("paymentsUpdated", loadDashboard);
      socket.disconnect();
    };
  }, [loadDashboard]);

  const handleSeatInput = (event) => {
    const { name, value } = event.target;
    setSeatForm((current) => ({ ...current, [name]: value }));
  };

  const handleBulkInput = (event) => {
    const { name, value } = event.target;
    setBulkForm((current) => ({ ...current, [name]: value }));
  };

  const submitSingleSeat = async (event) => {
    event.preventDefault();
    setSubmitting("single");
    try {
      await createSeat(seatForm);
      toast.success("Seat created successfully");
      setSeatForm(defaultSeatForm);
      await loadDashboard();
    } catch (error) {
      toast.error(String(error));
    } finally {
      setSubmitting("");
    }
  };

  const submitBulkSeats = async (event) => {
    event.preventDefault();
    setSubmitting("bulk");
    try {
      await bulkCreateSeats({ ...bulkForm, count: Number(bulkForm.count) });
      toast.success("Bulk seats created successfully");
      setBulkForm(defaultBulkForm);
      await loadDashboard();
    } catch (error) {
      toast.error(String(error));
    } finally {
      setSubmitting("");
    }
  };

  const stats = dashboard?.stats || {
    totalStudents: 0,
    totalSeats: 0,
    occupiedSeats: 0,
    reservedSeats: 0,
    availableSeats: 0,
    todayAttendance: 0,
    activeBookings: 0,
    totalRevenue: 0,
    totalPayments: 0,
  };

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="Monitor occupancy, attendance trends, and manage the seat inventory from one place."
    >
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
        <StatCard label="Students" value={stats.totalStudents} accent="indigo" />
        <StatCard label="Total Seats" value={stats.totalSeats} accent="indigo" />
        <StatCard label="Occupied Seats" value={stats.occupiedSeats} accent="rose" />
        <StatCard label="Reserved Seats" value={stats.reservedSeats} accent="amber" />
        <StatCard label="Available Seats" value={stats.availableSeats} accent="emerald" />
        <StatCard label="Today's Attendance" value={stats.todayAttendance} accent="indigo" />
        <StatCard label="Active Bookings" value={stats.activeBookings} accent="amber" />
        <StatCard label="Payments" value={stats.totalPayments} accent="emerald" />
        <StatCard label="Revenue" value={formatCurrency(stats.totalRevenue)} accent="rose" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <Link
          to="/admin/attendance"
          className="group relative overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-600 to-teal-800 p-6 text-white shadow-xl shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:shadow-2xl"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-100/90">Face log</p>
          <h3 className="mt-2 font-display text-xl font-bold">Face Attendance</h3>
          <p className="mt-2 text-sm text-emerald-100/90">Name, date, time &amp; status from recognition marks.</p>
          <span className="mt-4 inline-flex text-sm font-bold text-white group-hover:underline">Open page →</span>
        </Link>
        <Link
          to="/admin/mark-attendance"
          className="group relative overflow-hidden rounded-3xl border border-cyan-200/50 bg-gradient-to-br from-cyan-600 to-slate-900 p-6 text-white shadow-xl shadow-cyan-900/25 transition hover:-translate-y-0.5 hover:shadow-2xl"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-100/90">Camera</p>
          <h3 className="mt-2 font-display text-xl font-bold">Mark Attendance</h3>
          <p className="mt-2 text-sm text-cyan-100/90">Select any student and verify face vs their profile photo.</p>
          <span className="mt-4 inline-flex text-sm font-bold text-white group-hover:underline">Open page →</span>
        </Link>
        <Link
          to="/admin/payments"
          className="group relative overflow-hidden rounded-3xl border border-amber-200/50 bg-gradient-to-br from-amber-600 to-orange-900 p-6 text-white shadow-xl shadow-amber-900/25 transition hover:-translate-y-0.5 hover:shadow-2xl"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-100/90">Treasury</p>
          <h3 className="mt-2 font-display text-xl font-bold">All Payments</h3>
          <p className="mt-2 text-sm text-amber-100/90">Razorpay IDs, plans, revenue totals.</p>
          <span className="mt-4 inline-flex text-sm font-bold text-white group-hover:underline">Open page →</span>
        </Link>
        <Link
          to="/admin/cash-booking"
          className="group relative overflow-hidden rounded-3xl border border-lime-200/50 bg-gradient-to-br from-lime-700 to-emerald-950 p-6 text-white shadow-xl shadow-emerald-900/25 transition hover:-translate-y-0.5 hover:shadow-2xl"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-lime-100/90">Desk</p>
          <h3 className="mt-2 font-display text-xl font-bold">Cash seat booking</h3>
          <p className="mt-2 text-sm text-lime-100/90">Cash turant received — seat book + receipt.</p>
          <span className="mt-4 inline-flex text-sm font-bold text-white group-hover:underline">Open page →</span>
        </Link>
        <Link
          to="/admin/students"
          className="group relative overflow-hidden rounded-3xl border border-violet-200/50 bg-gradient-to-br from-violet-600 to-indigo-900 p-6 text-white shadow-xl shadow-violet-900/25 transition hover:-translate-y-0.5 hover:shadow-2xl"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-violet-100/90">Directory</p>
          <h3 className="mt-2 font-display text-xl font-bold">Registered Students</h3>
          <p className="mt-2 text-sm text-violet-100/90">Card grid with IDs, email & penalty.</p>
          <span className="mt-4 inline-flex text-sm font-bold text-white group-hover:underline">Open page →</span>
        </Link>
      </div>

      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/50">
            <h2 className="text-2xl font-bold text-slate-900">Create Single Seat</h2>
            <form className="mt-5 space-y-4" onSubmit={submitSingleSeat}>
              <input
                name="seatNumber"
                value={seatForm.seatNumber}
                onChange={handleSeatInput}
                required
                placeholder="Seat number, e.g. A-101"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400"
              />
              <select
                name="seatType"
                value={seatForm.seatType}
                onChange={handleSeatInput}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400"
              >
                {['Regular', 'AC', 'Silent', 'Group'].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={submitting === "single"}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting === "single" ? "Creating..." : "Add Seat"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/50">
            <h2 className="text-2xl font-bold text-slate-900">Bulk Seat Generation</h2>
            <form className="mt-5 space-y-4" onSubmit={submitBulkSeats}>
              <input
                name="count"
                type="number"
                min="1"
                value={bulkForm.count}
                onChange={handleBulkInput}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400"
              />
              <input
                name="prefix"
                value={bulkForm.prefix}
                onChange={handleBulkInput}
                placeholder="Prefix"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400"
              />
              <select
                name="seatType"
                value={bulkForm.seatType}
                onChange={handleBulkInput}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400"
              >
                {['Regular', 'AC', 'Silent', 'Group'].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={submitting === "bulk"}
                className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting === "bulk" ? "Generating..." : "Generate Seats"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/50">
            <h2 className="text-2xl font-bold text-slate-900">Peak Hours</h2>
            <div className="mt-4 space-y-3">
              {(dashboard?.peakHours || []).map((hour) => (
                <div key={hour._id} className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
                  Peak around <span className="font-semibold">{hour._id}:00</span> with <span className="font-semibold">{hour.count}</span> check-ins.
                </div>
              ))}
              {!dashboard?.peakHours?.length && <p className="text-sm text-slate-500">Attendance analytics will appear after check-ins are recorded.</p>}
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/50">
            <h2 className="text-2xl font-bold text-slate-900">Recent Bookings</h2>
            <div className="mt-5 overflow-x-auto overscroll-x-contain">
              <table className="min-w-full text-left text-sm text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.3em] text-slate-500">
                    <th className="pb-3 pr-4">Student</th>
                    <th className="pb-3 pr-4">Seat</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Ends</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 8).map((booking) => (
                    <tr key={booking._id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-semibold text-slate-800">{booking.student?.name}</td>
                      <td className="py-3 pr-4">{booking.seat?.seatNumber}</td>
                      <td className="py-3 pr-4 capitalize">{booking.status}</td>
                      <td className="py-3 pr-4">{formatTime(booking.endTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
