import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import ReceiptTemplate from "../components/ReceiptTemplate";
import { fetchPaymentById } from "../services/libraryService";
import Loader from "../components/Loader";
import { useAuth } from "../context/useAuth";

const buildReceiptData = (payment) => {
  const st = payment.student;
  const seat = payment.seat;
  const fallbackCourse =
    payment.courseServiceName ||
    [seat?.seatNumber ? "Seat " + seat.seatNumber : null, payment.durationLabel].filter(Boolean).join(" · ");

  return {
    companyName: payment.companyName || "Library Hub",
    logoUrl: payment.receiptLogoUrl || "",
    receiptId: payment.receiptId || "REC-" + String(payment._id).slice(-8).toUpperCase(),
    razorpayPaymentId: payment.razorpayPaymentId,
    razorpayOrderId: payment.razorpayOrderId,
    paidAt: payment.paidAt || payment.createdAt,
    studentName: payment.nameSnapshot || st?.name || "—",
    email: payment.emailSnapshot || st?.email || "—",
    phone: payment.phone || st?.phone || "—",
    courseServiceName: fallbackCourse || "—",
    amountPaise: payment.amount,
    paymentMethod: payment.paymentMethod || "Razorpay",
    statusLabel: "SUCCESS",
  };
};

const Receipt = () => {
  const { user } = useAuth();
  const { paymentId } = useParams();
  const slipRef = useRef(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);

  const load = useCallback(async () => {
    if (!paymentId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetchPaymentById(paymentId);
      setPayment(res.payment);
    } catch (e) {
      toast.error(String(e));
      setPayment(null);
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    load();
  }, [load]);

  const receiptData = useMemo(() => (payment ? buildReceiptData(payment) : null), [payment]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const el = slipRef.current;
    if (!el) {
      toast.error("Receipt is not ready yet.");
      return;
    }
    setPdfBusy(true);
    try {
      const { downloadElementAsPdf } = await import("../utils/receiptPdf");
      const safeName = String(payment?.receiptId || paymentId || "slip").replace(/[^\w.-]+/g, "_");
      const filename = "payment-receipt-" + safeName + ".pdf";
      await downloadElementAsPdf(el, filename);
      toast.success("PDF downloaded");
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "PDF download failed. Try Print → Save as PDF.");
    } finally {
      setPdfBusy(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Payment receipt" subtitle="Loading your receipt…">
        <Loader label="Loading receipt…" />
      </DashboardLayout>
    );
  }

  if (!receiptData) {
    return (
      <DashboardLayout title="Payment receipt" subtitle="We could not load this receipt.">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
          <p className="font-medium">Receipt unavailable or payment not completed.</p>
          <Link
            to="/student/payments"
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white"
          >
            Back to payments
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Payment receipt" subtitle="Official payment slip — print or download as PDF.">
      <div className="font-display min-w-0 max-w-full overflow-x-hidden print:bg-white">
        <div className="no-print mb-6 flex w-full max-w-full flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={pdfBusy}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-40"
          >
            {pdfBusy ? "Preparing PDF…" : "Download PDF"}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 sm:w-auto sm:min-w-40"
          >
            Print slip
          </button>
          <Link
            to={user?.role === "admin" ? "/admin/payments" : "/student/seats"}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-800 ring-1 ring-slate-200/80 transition hover:bg-slate-200/80 sm:w-auto"
          >
            {user?.role === "admin" ? "All payments" : "Book seats"}
          </Link>
        </div>

        <div className="mx-auto flex w-full min-w-0 max-w-full justify-center px-3 sm:px-4 md:px-6 print:block print:p-0 print:px-0">
          <ReceiptTemplate ref={slipRef} data={receiptData} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Receipt;
