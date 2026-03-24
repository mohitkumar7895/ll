import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import { fetchPayments } from "../services/libraryService";
import { getSocket } from "../services/socket";
import { formatCurrency, formatDateTime } from "../utils/format";
import { isCollectedPayment, isReceiptAvailable } from "../utils/paymentDisplay";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "online", label: "Online" },
  { value: "cash_pending", label: "Cash pending" },
  { value: "cash_received", label: "Cash received" },
];

const rowStatusLabel = (p) => {
  if (p.status === "ONLINE_SUCCESS" || (p.status === "paid" && p.paymentMethod !== "CASH")) return "Online paid";
  if (p.status === "CASH_PENDING") return "Cash pending";
  if (p.status === "CASH_RECEIVED") return "Cash received";
  return p.status;
};

const StudentPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    try {
      const res = await fetchPayments();
      setPayments(res.payments || []);
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
    socket.on("paymentsUpdated", load);
    return () => {
      socket.off("paymentsUpdated", load);
    };
  }, [load]);

  const totals = useMemo(() => {
    const collected = payments.filter((p) => isCollectedPayment(p.status));
    const sum = collected.reduce((acc, p) => acc + (p.amount || 0), 0);
    return { count: collected.length, sum };
  }, [payments]);

  const filtered = useMemo(() => {
    if (filter === "all") return payments;
    if (filter === "online") {
      return payments.filter((p) => p.status === "ONLINE_SUCCESS" || (p.status === "paid" && p.paymentMethod !== "CASH"));
    }
    if (filter === "cash_pending") return payments.filter((p) => p.status === "CASH_PENDING");
    if (filter === "cash_received") return payments.filter((p) => p.status === "CASH_RECEIVED");
    return payments;
  }, [payments, filter]);

  return (
    <DashboardLayout
      title="My Payments"
      subtitle="Online and cash receipts — same slip. New cash bookings are recorded as received."
    >
      <div className="font-display min-w-0">
        <div className="relative overflow-hidden rounded-[2rem] border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-950 via-slate-900 to-violet-950 p-5 text-white shadow-2xl shadow-fuchsia-900/25 sm:p-8 md:p-10">
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" aria-hidden />
          <div className="relative flex min-w-0 flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-fuchsia-300/90">Wallet</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">Payment history</h2>
              <p className="mt-3 max-w-xl text-sm text-slate-300">Collected payments (online + cash received) count toward total spent.</p>
            </div>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-200/80">Collected</p>
                <p className="text-2xl font-bold tabular-nums">{totals.count}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-200/80">Total spent</p>
                <p className="text-2xl font-bold tabular-nums">{formatCurrency(totals.sum)}</p>
              </div>
              <Link
                to="/student/dashboard"
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-fuchsia-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-fuchsia-300"
              >
                ← Home
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={
                "rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition " +
                (filter === f.value ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50")
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-6 min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50">
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-fuchsia-50/40 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                  <th className="px-5 py-4">Seat</th>
                  <th className="px-5 py-4">Plan</th>
                  <th className="px-5 py-4">Method</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Paid at</th>
                  <th className="px-5 py-4">Gateway ID</th>
                  <th className="px-5 py-4">Receipt</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      Loading…
                    </td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((p) => (
                    <tr key={p._id} className="border-b border-slate-100 hover:bg-fuchsia-50/20">
                      <td className="px-5 py-4 font-semibold">{p.seat?.seatNumber || p.seatNumber || "—"}</td>
                      <td className="px-5 py-4">{p.durationLabel}</td>
                      <td className="px-5 py-4">
                        <span
                          className={
                            "text-xs font-bold " + (p.paymentMethod === "CASH" ? "text-sky-700" : "text-indigo-700")
                          }
                        >
                          {p.paymentMethod === "CASH" ? "Cash" : "Online"}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold tabular-nums">{formatCurrency(p.amount)}</td>
                      <td className="px-5 py-4 text-xs font-semibold capitalize text-slate-800">{rowStatusLabel(p)}</td>
                      <td className="px-5 py-4 text-xs tabular-nums text-slate-600">{formatDateTime(p.paidAt || p.createdAt)}</td>
                      <td className="max-w-[120px] truncate px-5 py-4 font-mono text-xs">{p.razorpayPaymentId || "—"}</td>
                      <td className="px-5 py-4">
                        {isReceiptAvailable(p.status) ? (
                          <Link
                            to={"/student/receipt/" + p._id}
                            className="font-bold text-indigo-600 underline-offset-2 hover:underline"
                          >
                            View
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                      No payments in this filter.
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

export default StudentPaymentsPage;
