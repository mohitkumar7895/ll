const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    /** Same as student — kept for API parity with receipt / external integrations */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
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
      enum: [
        "created",
        "failed",
        "cancelled",
        "paid",
        "ONLINE_SUCCESS",
        "CASH_PENDING",
        "CASH_RECEIVED",
      ],
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
    /** Unique receipt number shown on payment slip (set when status becomes paid) */
    receiptId: {
      type: String,
      trim: true,
      default: null,
      sparse: true,
      unique: true,
    },
    /** Denormalized for receipt PDF even if profile changes later */
    nameSnapshot: {
      type: String,
      trim: true,
      default: "",
    },
    emailSnapshot: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    /** Course / service line on slip, e.g. "B.Tech · Seat A12 · Full day" */
    courseServiceName: {
      type: String,
      trim: true,
      default: "",
    },
    /** ONLINE = Razorpay; CASH = offline collection */
    paymentMethod: {
      type: String,
      enum: ["ONLINE", "CASH", "Razorpay"],
      default: "ONLINE",
    },
    companyName: {
      type: String,
      trim: true,
      default: "",
    },
    receiptLogoUrl: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

/** Mongoose 9+ — `next` is not always passed to sync hooks; use async or return Promise. */
paymentSchema.pre("save", async function () {
  if (this.student && !this.userId) {
    this.userId = this.student;
  }
  if (this.userId && !this.student) {
    this.student = this.userId;
  }
});

module.exports = mongoose.model("Payment", paymentSchema);
