import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import SeatGrid from "../components/SeatGrid";
import { useAuth } from "../context/useAuth";
import { cancelBooking, createPaymentOrder, fetchBookings, fetchPaymentConfig, fetchSeats, verifyPayment } from "../services/libraryService";
import { getSocket } from "../services/socket";
import { formatCurrency, formatDateTime } from "../utils/format";

const durations = [
  { key: "full-day", label: "Full Day", amount: 9900 },
  { key: "monthly", label: "Monthly", amount: 199900 },
];

const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Razorpay checkout")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });

const SeatBookingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [seats, setSeats] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [durationKey, setDurationKey] = useState("full-day");
  const [loading, setLoading] = useState(true);
  const [bookingAction, setBookingAction] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [paymentMode, setPaymentMode] = useState("online");

  const loadData = useCallback(async () => {
    try {
      const [seatResponse, bookingResponse] = await Promise.all([fetchSeats(), fetchBookings()]);
      setSeats(seatResponse.seats);
      setBookings(bookingResponse.bookings);
      setSelectedSeat((current) => seatResponse.seats.find((seat) => seat._id === current?._id) || null);
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

  const activeBooking = useMemo(
    () => bookings.find((booking) => ["reserved", "active"].includes(booking.status) && new Date(booking.endTime) > new Date()),
    [bookings]
  );

  const selectedPlan = useMemo(() => durations.find((duration) => duration.key === durationKey) || durations[0], [durationKey]);

  const filteredSeats = useMemo(() => {
    if (typeFilter === "all") return seats;
    return seats.filter((s) => s.seatType === typeFilter);
  }, [seats, typeFilter]);

  const handleBookSeat = async () => {
    if (!seats.length) {
      toast.error("No seats available right now. Ask admin to create seats.");
      return;
    }

    if (activeBooking) {
      toast.error("You already have an active booking. Cancel it or wait for it to end.");
      return;
    }

    if (!selectedSeat) {
      toast.error("Select an available seat first");
      return;
    }

    setBookingAction("payment");
    try {
      const configResponse = await fetchPaymentConfig();
      if (!configResponse.key) {
        throw new Error("Razorpay key missing hai. Server .env me RAZORPAY_KEY_ID add karo.");
      }

      await loadRazorpayScript();
      const orderResponse = await createPaymentOrder({ seatId: selectedSeat._id, durationKey });

      const razorpay = new window.Razorpay({
        key: configResponse.key,
        amount: orderResponse.order.amount,
        currency: orderResponse.order.currency,
        name: "Library Hub",
        description: selectedSeat.seatNumber + " - " + orderResponse.pricing.label,
        order_id: orderResponse.order.id,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        notes: {
          seatNumber: selectedSeat.seatNumber,
          durationLabel: orderResponse.pricing.label,
        },
        theme: {
          color: "#0f172a",
        },
        modal: {
          ondismiss: () => {
            setBookingAction("");
            toast("Payment popup closed");
          },
        },
        handler: async (response) => {
          setBookingAction("verify");
          try {
            const verifyResponse = await verifyPayment({
              paymentRecordId: orderResponse.payment._id,
              seatId: selectedSeat._id,
              durationKey,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success(verifyResponse.message || "Payment successful and seat booked");
            await loadData();
            navigate("/student/payment-success", {
              state: { paymentId: verifyResponse.payment?._id },
              replace: false,
            });
          } catch (error) {
            toast.error(String(error));
          } finally {
            setBookingAction("");
          }
        },
      });

      razorpay.open();
    } catch (error) {
      setBookingAction("");
      toast.error(String(error));
    }
  };

  const handleCancelBooking = async () => {
    if (!activeBooking) {
      return;
    }

    setBookingAction("cancel");
    try {
      await cancelBooking(activeBooking._id);
      toast.success("Booking cancelled successfully");
      await loadData();
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
      title="Pick your spot"
      subtitle="Live grid — green free, amber held, red taken. Pay online with Razorpay. Cash bookings are done by admin only."
    >
      <div className="font-display min-w-0 space-y-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/60 bg-gradient-to-r from-slate-900 via-indigo-950 to-fuchsia-950 p-4 text-white shadow-xl sm:p-6 md:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" aria-hidden />
          <div className="relative flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-300/90">Live floor</p>
              <h2 className="mt-2 text-xl font-extrabold leading-snug sm:text-2xl md:text-3xl">
                100 seats. One tap. Instant reserve.
              </h2>
            </div>
            <Link
              to="/student/bookings"
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-bold backdrop-blur-sm transition hover:bg-white/20"
            >
              View booking history →
            </Link>
          </div>
        </div>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-300/20">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-fuchsia-50/20 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Seat map</h2>
                  <p className="text-xs text-slate-500">Corner badge: R Regular · A AC · S Silent · G Group</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["all", "Regular", "AC", "Silent", "Group"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTypeFilter(t)}
                      className={
                        "rounded-full px-3 py-1.5 text-xs font-bold transition " +
                        (typeFilter === t
                          ? "bg-slate-900 text-white shadow-md"
                          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50")
                      }
                    >
                      {t === "all" ? "All types" : t}
                    </button>
                  ))}
                </div>
              </div>
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
                  <span className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  <p className="text-sm font-medium text-slate-500">Loading seat map…</p>
                </div>
              ) : seats.length ? (
                <SeatGrid seats={filteredSeats} selectedSeatId={selectedSeat?._id} onSelect={setSelectedSeat} />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  No seats yet. Ask admin to add seats or restart the server to seed defaults.
                </div>
              )}
            </div>
          </section>

          <div className="space-y-6">
            <section className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-indigo-200/20">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-400/10 blur-3xl" />
              <h2 className="relative text-xl font-bold text-slate-900">Checkout</h2>
              <p className="relative mt-1 text-sm text-slate-500">Seat + plan + payment online via Razorpay. For cash, ask admin to book from the admin panel.</p>

              <div className="relative mt-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-5 ring-1 ring-indigo-100/50">
                {selectedSeat ? (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Selected</p>
                      <p className="mt-1 text-2xl font-black text-slate-900">{selectedSeat.seatNumber}</p>
                      <p className="mt-1 text-sm font-medium text-slate-600">{selectedSeat.seatType} seat</p>
                    </div>
                    <span className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-md">Ready</span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Map se koi <span className="font-semibold text-emerald-700">free</span> seat chunein.</p>
                )}
              </div>

              <p className="relative mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">Plan</p>
              <div className="relative mt-2 grid gap-2 sm:grid-cols-2">
                {durations.map((duration) => (
                  <button
                    key={duration.key}
                    type="button"
                    onClick={() => setDurationKey(duration.key)}
                    className={
                      "rounded-2xl border-2 px-4 py-4 text-left transition " +
                      (durationKey === duration.key
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300")
                    }
                  >
                    <span className="block text-sm font-bold">{duration.label}</span>
                    <span className={"mt-1 block text-xs " + (durationKey === duration.key ? "text-indigo-100" : "text-slate-500")}>
                      {formatCurrency(duration.amount)}
                    </span>
                  </button>
                ))}
              </div>

              <div className="relative mt-5 rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Plan</span>
                  <span className="font-semibold text-slate-900">{selectedPlan.label}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-slate-200/80 pt-3 text-sm">
                  <span className="font-bold text-slate-800">Pay</span>
                  <span className="text-lg font-black text-indigo-700">{formatCurrency(selectedPlan.amount)}</span>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                  Razorpay se payment verify hone ke baad seat confirm ho jayegi.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBookSeat}
                disabled={Boolean(bookingAction) || !selectedSeat || Boolean(activeBooking)}
                className="relative mt-5 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-700 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-500 hover:to-violet-600 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {bookingAction === "payment"
                  ? "Opening Razorpay…"
                  : bookingAction === "verify"
                    ? "Verifying…"
                    : "Pay & lock seat"}
              </button>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/40">
              <h2 className="text-lg font-bold text-slate-900">Active booking</h2>
              {activeBooking ? (
                <div className="mt-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-5 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-black text-slate-900">{activeBooking.seat?.seatNumber}</p>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold capitalize text-emerald-800">
                      {activeBooking.status}
                    </span>
                  </div>
                  <p className="mt-2 text-slate-600">{activeBooking.seat?.seatType}</p>
                  <p className="mt-1 text-xs text-slate-500">{activeBooking.durationLabel}</p>
                  <p className="mt-3 text-xs font-medium text-slate-600">Ends {formatDateTime(activeBooking.endTime)}</p>
                  <button
                    type="button"
                    onClick={handleCancelBooking}
                    disabled={bookingAction === "cancel"}
                    className="mt-4 w-full rounded-xl border-2 border-rose-200 bg-white py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                  >
                    {bookingAction === "cancel" ? "Cancelling…" : "Release seat"}
                  </button>
                </div>
              ) : (
                <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Koi active booking nahi — map se book karein.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SeatBookingPage;
