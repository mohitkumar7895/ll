const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    seat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      required: true,
    },
    durationKey: {
      type: String,
      required: true,
      enum: ["full-day", "monthly"],
    },
    durationLabel: {
      type: String,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["reserved", "active", "completed", "expired", "cancelled", "no-show"],
      default: "reserved",
    },
    checkedInAt: Date,
    checkedOutAt: Date,
  },
  { timestamps: true }
);

bookingSchema.index({ endTime: 1, status: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
