import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import { fetchPayments } from "../services/libraryService";
import { getSocket } from "../services/socket";
import { formatCurrency, formatDateTime } from "../utils/format";

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ totalPayments: 0, successfulPayments: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetchPayments();
      setPayments(res.payments || []);
      setStats(res.stats || { totalPayments: 0, successfulPayments: 0, totalRevenue: 0 });
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      const name = p.student?.name?.toLowerCase() || "";
      const email = p.student?.email?.toLowerCase() || "";
      const pid = (p.razorpayPaymentId || "").toLowerCase();
      return name.includes(q) || email.includes(q) || pid.includes(q);
    });
  }, [payments, statusFilter, query]);

  return (
    <DashboardLayout
      title="Payments"
      subtitle="Every Razorpay transaction — revenue, plans, and payout-ready IDs in one view."
    >
      <div className="font-display min-w-0">
        <div className="relative overflow-hidden rounded-[2rem] border border-amber-500/25 bg-gradient-to-br from-amber-950 via-slate-900 to-slate-950 p-5 text-white shadow-2xl shadow-amber-900/25 sm:p-8 md:p-10">
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 -translate-y-1/2 translate-x-1/3 rounded-full bg-amber-400/15 blur-3xl" aria-hidden />
          <div className="relative flex min-w-0 flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/90">Treasury</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">All payments</h2>
              <p className="mt-3 max-w-xl text-sm text-slate-300">
                Filter by status, search student or Razorpay ID. Totals update when new payments verify.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-200/80">Successful</p>
                <p className="text-2xl font-bold tabular-nums">{stats.successfulPayments ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-200/80">Revenue</p>
                <p className="text-2xl font-bold tabular-nums">{formatCurrency(stats.totalRevenue || 0)}</p>
              </div>
              <Link
                to="/admin/dashboard"
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-amber-300"
              >
                ← Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {["all", "paid", "created", "failed", "cancelled"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={
                  "rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition " +
                  (statusFilter === s
                    ? "bg-slate-900 text-white shadow-lg"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50")
                }
              >
                {s}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student, email, payment ID…"
            className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 sm:w-96 sm:text-sm"
          />
        </div>

        <div className="mt-6 min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50">
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-amber-50/50 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Seat</th>
                  <th className="px-5 py-4">Plan</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Paid at</th>
                  <th className="px-5 py-4">Payment ID</th>
                  <th className="px-5 py-4">Receipt</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                      Loading payments…
                    </td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((payment) => (
                    <tr key={payment._id} className="border-b border-slate-100 transition hover:bg-amber-50/30">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{payment.student?.name || "—"}</p>
                        <p className="text-xs text-slate-500">{payment.student?.email}</p>
                      </td>
                      <td className="px-5 py-4 font-medium">{payment.seat?.seatNumber || payment.seatNumber || "—"}</td>
                      <td className="px-5 py-4">{payment.durationLabel}</td>
                      <td className="px-5 py-4 font-semibold tabular-nums text-slate-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-800">
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs tabular-nums text-slate-600">
                        {formatDateTime(payment.paidAt || payment.createdAt)}
                      </td>
                      <td className="max-w-[140px] truncate px-5 py-4 font-mono text-xs text-slate-600">
                        {payment.razorpayPaymentId || "—"}
                      </td>
                      <td className="px-5 py-4">
                        {payment.status === "paid" ? (
                          <Link
                            to={"/admin/receipt/" + payment._id}
                            className="font-bold text-amber-800 underline-offset-2 hover:underline"
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
                      No payments match your filters.
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

export default AdminPaymentsPage;
