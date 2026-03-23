const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    seat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      default: null,
    },
    seatNumber: {
      type: String,
      trim: true,
      default: "",
    },
    durationKey: {
      type: String,
      enum: ["full-day", "monthly"],
      required: true,
    },
    durationLabel: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "cancelled"],
      default: "created",
    },
    razorpayOrderId: {
      type: String,
      default: "",
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: "",
      index: true,
    },
    razorpaySignature: {
      type: String,
      default: "",
    },
    notes: {
      type: Object,
      default: {},
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
