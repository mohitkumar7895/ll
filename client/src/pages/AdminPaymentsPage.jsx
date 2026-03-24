import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import { fetchPayments, markCashPaymentPaid } from "../services/libraryService";
import { getSocket } from "../services/socket";
import { formatCurrency, formatDateTime } from "../utils/format";
import { isReceiptAvailable } from "../utils/paymentDisplay";

const CATEGORY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "online", label: "Online" },
  { value: "cash_pending", label: "Cash pending" },
  { value: "cash_received", label: "Cash received" },
];

const statusBadgeClass = (status, method) => {
  if (status === "CASH_PENDING") return "bg-amber-100 text-amber-900 ring-amber-200";
  if (status === "CASH_RECEIVED" || method === "CASH") return "bg-sky-100 text-sky-900 ring-sky-200";
  if (status === "ONLINE_SUCCESS" || status === "paid") return "bg-emerald-100 text-emerald-900 ring-emerald-200";
  if (status === "created") return "bg-slate-100 text-slate-800 ring-slate-200";
  if (status === "failed") return "bg-rose-100 text-rose-900 ring-rose-200";
  return "bg-slate-100 text-slate-800 ring-slate-200";
};

const statusLabel = (p) => {
  const m = p.paymentMethod;
  if (p.status === "ONLINE_SUCCESS" || (p.status === "paid" && m !== "CASH")) return "Online paid";
  if (p.status === "CASH_PENDING") return "Cash pending";
  if (p.status === "CASH_RECEIVED") return "Cash received";
  return p.status;
};

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ totalPayments: 0, successfulPayments: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [markingId, setMarkingId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = category === "all" ? {} : { category };
      const res = await fetchPayments(params);
      setPayments(res.payments || []);
      setStats(res.stats || { totalPayments: 0, successfulPayments: 0, totalRevenue: 0 });
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  }, [category]);

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
      if (!q) return true;
      const name = p.student?.name?.toLowerCase() || "";
      const email = p.student?.email?.toLowerCase() || "";
      const pid = (p.razorpayPaymentId || "").toLowerCase();
      const rid = (p.receiptId || "").toLowerCase();
      return name.includes(q) || email.includes(q) || pid.includes(q) || rid.includes(q);
    });
  }, [payments, query]);

  const handleMarkPaid = async (paymentId) => {
    setMarkingId(paymentId);
    try {
      await markCashPaymentPaid(paymentId);
      toast.success("Marked as cash received");
      await load();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setMarkingId("");
    }
  };

  return (
    <DashboardLayout
      title="Payments"
      subtitle="Online (Razorpay) and cash received. Mark pending only if old records are still open."
    >
      <div className="font-display min-w-0">
        <div className="relative overflow-hidden rounded-[2rem] border border-amber-500/25 bg-gradient-to-br from-amber-950 via-slate-900 to-slate-950 p-5 text-white shadow-2xl shadow-amber-900/25 sm:p-8 md:p-10">
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 -translate-y-1/2 translate-x-1/3 rounded-full bg-amber-400/15 blur-3xl" aria-hidden />
          <div className="relative flex min-w-0 flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/90">Treasury</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">All payments</h2>
              <p className="mt-3 max-w-xl text-sm text-slate-300">
                Green = paid online, blue tint = cash received. Amber = legacy cash pending (mark as received if needed).
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
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                className={
                  "rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition " +
                  (category === opt.value
                    ? "bg-slate-900 text-white shadow-lg"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50")
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student, email, receipt ID…"
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
                  <th className="px-5 py-4">Method</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Paid at</th>
                  <th className="px-5 py-4">Gateway ID</th>
                  <th className="px-5 py-4">Receipt</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-slate-500">
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
                      <td className="px-5 py-4">
                        <span
                          className={
                            "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 " +
                            (payment.paymentMethod === "CASH" ? "bg-sky-50 text-sky-900 ring-sky-200" : "bg-indigo-50 text-indigo-900 ring-indigo-200")
                          }
                        >
                          {payment.paymentMethod === "CASH" ? "Cash" : "Online"}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold tabular-nums text-slate-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={
                            "inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 " + statusBadgeClass(payment.status, payment.paymentMethod)
                          }
                        >
                          {statusLabel(payment)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs tabular-nums text-slate-600">
                        {formatDateTime(payment.paidAt || payment.createdAt)}
                      </td>
                      <td className="max-w-[120px] truncate px-5 py-4 font-mono text-xs text-slate-600">
                        {payment.razorpayPaymentId || "—"}
                      </td>
                      <td className="px-5 py-4">
                        {isReceiptAvailable(payment.status) ? (
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
                      <td className="px-5 py-4">
                        {payment.status === "CASH_PENDING" ? (
                          <button
                            type="button"
                            disabled={markingId === payment._id}
                            onClick={() => handleMarkPaid(payment._id)}
                            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
                          >
                            {markingId === payment._id ? "…" : "Mark as paid"}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-slate-500">
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
