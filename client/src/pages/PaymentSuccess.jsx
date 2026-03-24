import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";

/**
 * Brief success step after Razorpay — then redirect to the receipt page.
 */
const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const paymentId = location.state?.paymentId;

  useEffect(() => {
    if (!paymentId) {
      return;
    }
    const t = window.setTimeout(() => {
      navigate("/student/receipt/" + paymentId, { replace: true });
    }, 1400);
    return () => window.clearTimeout(t);
  }, [paymentId, navigate]);

  if (!paymentId) {
    return (
      <DashboardLayout title="Payment" subtitle="No payment reference.">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
          <p className="font-medium">Open this page from a completed payment to see your receipt.</p>
          <Link
            to="/student/seats"
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white"
          >
            Go to seat booking
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Payment successful" subtitle="Your seat is reserved — opening your receipt.">
      <div className="font-display flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-10 text-center shadow-inner">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-3xl text-white shadow-lg shadow-emerald-500/30">
          ✓
        </div>
        <h2 className="text-2xl font-black text-slate-900">Payment received</h2>
        <p className="max-w-md text-sm text-slate-600">Redirecting to your receipt…</p>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" aria-hidden />
        <Link
          to={"/student/receipt/" + paymentId}
          className="text-sm font-bold text-indigo-600 underline-offset-4 hover:underline"
        >
          Open receipt now
        </Link>
      </div>
    </DashboardLayout>
  );
};

export default PaymentSuccess;
