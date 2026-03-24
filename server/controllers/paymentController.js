const crypto = require("crypto");
const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Seat = require("../models/Seat");
const Booking = require("../models/Booking");
const { getBookingOption } = require("../utils/bookingDurations");
const { getRazorpay } = require("../utils/razorpay");
const { broadcastSeatState, broadcastPaymentsUpdate } = require("../utils/realtime");
const { sendEmail } = require("../utils/email");

const getPayments = async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { student: req.user._id };
    const payments = await Payment.find(query)
      .populate("student", "name email studentId")
      .populate("seat", "seatNumber seatType")
      .populate("booking", "status startTime endTime")
      .sort({ createdAt: -1 });

    const totalAmount = payments
      .filter((payment) => payment.status === "paid")
      .reduce((sum, payment) => sum + payment.amount, 0);

    return res.json({
      success: true,
      payments,
      stats: {
        totalPayments: payments.length,
        successfulPayments: payments.filter((payment) => payment.status === "paid").length,
        totalRevenue: totalAmount,
      },
    });
  } catch (error) {
    console.error("Fetching payments failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Failed to fetch payments" });
  }
};

const receiptCompanyName = () => (process.env.RECEIPT_COMPANY_NAME || process.env.COMPANY_NAME || "Library Hub").trim();

const receiptLogoUrl = () => (process.env.RECEIPT_LOGO_URL || "").trim();

const generateReceiptId = () => {
  const y = new Date().getFullYear();
  const rnd = crypto.randomBytes(4).toString("hex").toUpperCase();
  return "REC-" + y + "-" + rnd;
};

const getPaymentConfig = async (req, res) => {
  return res.json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID || "",
    receiptCompanyName: receiptCompanyName(),
    receiptLogoUrl: receiptLogoUrl(),
  });
};

const createOrder = async (req, res) => {
  try {
    const { seatId, durationKey } = req.body;
    const option = getBookingOption(durationKey);

    if (!seatId || !option) {
      return res.status(400).json({ success: false, error: "Valid seatId and durationKey are required" });
    }

    const existingActiveBooking = await Booking.findOne({
      student: req.user._id,
      status: { $in: ["reserved", "active"] },
      endTime: { $gt: new Date() },
    });

    if (existingActiveBooking) {
      return res.status(400).json({ success: false, error: "You already have an active booking" });
    }

    const seat = await Seat.findById(seatId);
    if (!seat) {
      return res.status(404).json({ success: false, error: "Seat not found" });
    }

    if (seat.status !== "available") {
      return res.status(400).json({ success: false, error: "Seat is not available" });
    }

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: option.amount,
      currency: option.currency,
      receipt: "rcpt_" + Date.now(),
      notes: {
        seatId: String(seat._id),
        seatNumber: seat.seatNumber,
        durationKey,
        studentId: String(req.user._id),
      },
    });

    const payment = await Payment.create({
      student: req.user._id,
      userId: req.user._id,
      seat: seat._id,
      seatNumber: seat.seatNumber,
      durationKey,
      durationLabel: option.label,
      amount: option.amount,
      currency: option.currency,
      status: "created",
      razorpayOrderId: order.id,
      notes: order.notes,
    });

    return res.status(201).json({
      success: true,
      order,
      payment,
      pricing: option,
    });
  } catch (error) {
    console.error("Creating Razorpay order failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Failed to create payment order" });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const {
      paymentRecordId,
      seatId,
      durationKey,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!paymentRecordId || !seatId || !durationKey || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: "Payment verification payload is incomplete" });
    }

    const payment = await Payment.findById(paymentRecordId);
    if (!payment) {
      return res.status(404).json({ success: false, error: "Payment record not found" });
    }

    if (payment.status === "paid") {
      return res.status(400).json({ success: false, error: "This payment is already verified" });
    }

    if (String(payment.student) !== String(req.user._id)) {
      return res.status(403).json({ success: false, error: "You can verify only your own payment" });
    }

    if (
      String(payment.seat) !== String(seatId) ||
      payment.durationKey !== durationKey ||
      payment.razorpayOrderId !== razorpay_order_id
    ) {
      return res.status(400).json({ success: false, error: "Payment details do not match the created order" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      payment.status = "failed";
      payment.razorpayPaymentId = razorpay_payment_id;
      payment.razorpaySignature = razorpay_signature;
      await payment.save();
      return res.status(400).json({ success: false, error: "Invalid payment signature" });
    }

    const option = getBookingOption(durationKey);
    if (!option) {
      return res.status(400).json({ success: false, error: "Invalid booking duration" });
    }

    const existingActiveBooking = await Booking.findOne({
      student: req.user._id,
      status: { $in: ["reserved", "active"] },
      endTime: { $gt: new Date() },
    });

    if (existingActiveBooking) {
      return res.status(400).json({ success: false, error: "You already have an active booking" });
    }

    const seat = await Seat.findById(seatId);
    if (!seat) {
      return res.status(404).json({ success: false, error: "Seat not found" });
    }

    if (seat.status !== "available") {
      return res.status(400).json({ success: false, error: "Seat is not available" });
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + option.minutes * 60 * 1000);

    const booking = await Booking.create({
      student: req.user._id,
      seat: seat._id,
      durationKey,
      durationLabel: option.label,
      durationMinutes: option.minutes,
      startTime,
      endTime,
      status: "reserved",
    });

    seat.status = "reserved";
    seat.activeBooking = booking._id;
    await seat.save();

    const courseParts = [];
    if (req.user.course && String(req.user.course).trim()) {
      courseParts.push(String(req.user.course).trim());
    }
    courseParts.push("Seat " + seat.seatNumber);
    courseParts.push(option.label);

    let receiptId = generateReceiptId();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const clash = await Payment.findOne({ receiptId });
      if (!clash) {
        break;
      }
      receiptId = generateReceiptId();
    }

    payment.booking = booking._id;
    payment.status = "paid";
    payment.razorpayOrderId = razorpay_order_id;
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paidAt = new Date();
    payment.receiptId = receiptId;
    payment.nameSnapshot = req.user.name || "";
    payment.emailSnapshot = req.user.email || "";
    payment.phone = req.user.phone || "";
    payment.courseServiceName = courseParts.join(" · ");
    payment.paymentMethod = "Razorpay";
    payment.companyName = receiptCompanyName();
    payment.receiptLogoUrl = receiptLogoUrl();
    payment.userId = req.user._id;
    await payment.save();

    await sendEmail({
      to: req.user.email,
      subject: "Payment successful and seat reserved",
      text:
        "Payment received for seat " +
        seat.seatNumber +
        ". Your booking is confirmed for plan " +
        option.label +
        ".",
    });

    await broadcastSeatState();
    broadcastPaymentsUpdate({ paymentId: payment._id, bookingId: booking._id });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("seat", "seatNumber seatType status")
      .populate("student", "name email studentId rollNo");

    const populatedPayment = await Payment.findById(payment._id)
      .populate("student", "name email studentId")
      .populate("seat", "seatNumber seatType")
      .populate("booking", "status startTime endTime durationLabel");

    return res.json({
      success: true,
      message: "Payment verified and seat booked successfully",
      booking: populatedBooking,
      payment: populatedPayment,
    });
  } catch (error) {
    console.error("Verifying payment failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Failed to verify payment" });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid payment id" });
    }

    const payment = await Payment.findById(id)
      .populate("student", "name email studentId phone course")
      .populate("seat", "seatNumber seatType")
      .populate("booking", "status startTime endTime durationLabel");

    if (!payment) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    const isOwner = String(payment.student?._id || payment.student) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    if (payment.status !== "paid") {
      return res.status(400).json({ success: false, error: "Receipt is available only for successful payments" });
    }

    return res.json({ success: true, payment });
  } catch (error) {
    console.error("Fetching payment failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Failed to fetch payment" });
  }
};

module.exports = {
  getPayments,
  getPaymentConfig,
  createOrder,
  verifyPayment,
  getPaymentById,
};
