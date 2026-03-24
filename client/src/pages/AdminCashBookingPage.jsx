import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import SeatGrid from "../components/SeatGrid";
import { adminCreateCashBooking, fetchSeats, fetchStudents } from "../services/libraryService";
import { getSocket } from "../services/socket";
import { formatCurrency } from "../utils/format";

const durations = [
  { key: "full-day", label: "Full Day", amount: 9900 },
  { key: "monthly", label: "Monthly", amount: 199900 },
];

const AdminCashBookingPage = () => {
  const navigate = useNavigate();
  const [seats, setSeats] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [durationKey, setDurationKey] = useState("full-day");
  const [loading, setLoading] = useState(true);
  const [bookingAction, setBookingAction] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [seatRes, studentRes] = await Promise.all([fetchSeats(), fetchStudents()]);
      setSeats(seatRes.seats || []);
      setStudents(studentRes.students || []);
      setSelectedSeat((current) => seatRes.seats?.find((seat) => seat._id === current?._id) || null);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const socket = getSocket();
    socket.connect();
    socket.on("seats:updated", loadData);
    socket.on("paymentsUpdated", loadData);
    return () => {
      socket.off("seats:updated", loadData);
      socket.off("paymentsUpdated", loadData);
      socket.disconnect();
    };
  }, [loadData]);

  const selectedPlan = useMemo(() => durations.find((d) => d.key === durationKey) || durations[0], [durationKey]);

  const selectedStudent = useMemo(() => students.find((s) => s._id === studentId), [students, studentId]);

  const handleBookCash = async () => {
    if (!studentId) {
      toast.error("Select a student first");
      return;
    }
    if (!selectedSeat) {
      toast.error("Select an available seat");
      return;
    }

    setBookingAction("cash");
    try {
      const res = await adminCreateCashBooking({
        studentId,
        seatId: selectedSeat._id,
        durationKey,
      });
      toast.success(res.message || "Cash booking created");
      await loadData();
      const pid = res.payment?._id || res.paymentId;
      if (pid) {
        navigate("/admin/receipt/" + pid, { replace: false });
      }
    } catch (error) {
      toast.error(String(error));
    } finally {
      setBookingAction("");
    }
  };

  const seatStats = {
    available: seats.filter((seat) => seat.status === "available").length,
    reserved: seats.filter((seat) => seat.status === "reserved").length,
    occupied: seats.filter((seat) => seat.status === "occupied").length,
  };

  return (
    <DashboardLayout
      title="Cash seat booking"
      subtitle="Student + seat + plan — cash is recorded here as Cash received. No pending step."
    >
      <div className="font-display min-w-0 space-y-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-amber-500/20 bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 p-4 text-white shadow-xl sm:p-6 md:p-8">
          <div className="relative flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-amber-200/90">Admin only</p>
              <h2 className="mt-2 text-xl font-extrabold leading-snug sm:text-2xl">Student + seat + cash receipt</h2>
            </div>
            <Link
              to="/admin/payments"
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-bold backdrop-blur-sm transition hover:bg-white/20"
            >
              Payments →
            </Link>
          </div>
        </div>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-300/20">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-amber-50/20 to-white px-5 py-4 sm:px-6">
              <h2 className="text-lg font-bold text-slate-900">Seat map</h2>
              <p className="mt-1 text-xs text-slate-500">Green = free · amber = held · red = busy</p>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                {[
                  ["Free", seatStats.available, "from-emerald-500 to-teal-600"],
                  ["Held", seatStats.reserved, "from-amber-400 to-orange-600"],
                  ["Busy", seatStats.occupied, "from-rose-500 to-rose-700"],
                ].map(([label, count, gradient]) => (
                  <div key={label} className={"rounded-2xl bg-gradient-to-br p-[1px] shadow-lg " + gradient}>
                    <div className="flex flex-col rounded-[0.9rem] bg-white/95 px-3 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
                      <span className="text-2xl font-black tabular-nums text-slate-900">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                  <span className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  <p className="text-sm font-medium text-slate-500">Loading…</p>
                </div>
              ) : seats.length ? (
                <SeatGrid seats={seats} selectedSeatId={selectedSeat?._id} onSelect={setSelectedSeat} />
              ) : (
                <p className="text-sm text-slate-500">No seats.</p>
              )}
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-xl">
              <h2 className="text-xl font-bold text-slate-900">Checkout (cash)</h2>
              <p className="mt-1 text-sm text-slate-500">
                Cash is saved as &quot;received&quot; immediately — it appears as Cash received under Payments.
              </p>

              <label className="mt-5 block text-xs font-bold uppercase tracking-wider text-slate-400">Student</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900"
              >
                <option value="">— Select a student —</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} · {s.studentId || s.email}
                  </option>
                ))}
              </select>
              {selectedStudent && <p className="mt-2 text-xs text-slate-600">{selectedStudent.email}</p>}

              <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                {selectedSeat ? (
                  <div>
                    <p className="text-xs font-bold uppercase text-amber-800">Seat</p>
                    <p className="text-2xl font-black text-slate-900">{selectedSeat.seatNumber}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">Choose a seat on the map.</p>
                )}
              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">Plan</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {durations.map((duration) => (
                  <button
                    key={duration.key}
                    type="button"
                    onClick={() => setDurationKey(duration.key)}
                    className={
                      "rounded-2xl border-2 px-4 py-4 text-left transition " +
                      (durationKey === duration.key
                        ? "border-amber-600 bg-amber-600 text-white shadow-lg"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300")
                    }
                  >
                    <span className="block text-sm font-bold">{duration.label}</span>
                    <span className={"mt-1 block text-xs " + (durationKey === duration.key ? "text-amber-100" : "text-slate-500")}>
                      {formatCurrency(duration.amount)}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-4 flex justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-600">Amount (cash)</span>
                <span className="text-lg font-black text-amber-800">{formatCurrency(selectedPlan.amount)}</span>
              </div>

              <button
                type="button"
                onClick={handleBookCash}
                disabled={Boolean(bookingAction) || !studentId || !selectedSeat}
                className="mt-5 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition hover:from-amber-400 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {bookingAction === "cash" ? "Booking…" : "Book seat & open receipt"}
              </button>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminCashBookingPage;
