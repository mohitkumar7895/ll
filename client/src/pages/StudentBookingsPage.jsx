import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import { fetchBookings } from "../services/libraryService";
import { getSocket } from "../services/socket";
import { formatDateTime } from "../utils/format";

const StudentBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetchBookings();
      setBookings(res.bookings || []);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const socket = getSocket();
    socket.connect();
    socket.on("seats:updated", load);
    socket.on("paymentsUpdated", load);
    return () => {
      socket.off("seats:updated", load);
      socket.off("paymentsUpdated", load);
    };
  }, [load]);

  const active = bookings.filter((b) => ["reserved", "active"].includes(b.status) && new Date(b.endTime) > new Date());

  return (
    <DashboardLayout
      title="My Bookings"
      subtitle="Every seat you’ve reserved — past and current — in one sleek timeline."
    >
      <div className="font-display min-w-0">
        <div className="relative overflow-hidden rounded-[2rem] border border-cyan-500/20 bg-gradient-to-br from-cyan-950 via-slate-900 to-indigo-950 p-5 text-white shadow-2xl shadow-cyan-900/25 sm:p-8 md:p-10">
          <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" aria-hidden />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/90">Reservations</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Booking history</h2>
              <p className="mt-3 max-w-xl text-sm text-slate-300">
                Live updates when you pay & book or when seats refresh.
              </p>
            </div>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-200/80">Active</p>
                <p className="text-2xl font-bold tabular-nums">{active.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-200/80">Total rows</p>
                <p className="text-2xl font-bold tabular-nums">{bookings.length}</p>
              </div>
              <Link
                to="/student/dashboard"
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-cyan-300"
              >
                ← Home
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 sm:mt-8">
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-cyan-50/50 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                  <th className="px-5 py-4">Seat</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Plan</th>
                  <th className="px-5 py-4">Ends</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                      Loading bookings…
                    </td>
                  </tr>
                ) : bookings.length ? (
                  bookings.map((booking) => (
                    <tr key={booking._id} className="border-b border-slate-100 transition hover:bg-cyan-50/20">
                      <td className="px-5 py-4 font-semibold text-slate-900">{booking.seat?.seatNumber}</td>
                      <td className="px-5 py-4">{booking.seat?.seatType}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize">
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">{booking.durationLabel}</td>
                      <td className="px-5 py-4 tabular-nums text-slate-600">{formatDateTime(booking.endTime)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                      No bookings yet.{" "}
                      <Link to="/student/seats" className="font-semibold text-cyan-700 underline">
                        Book a seat
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentBookingsPage;
