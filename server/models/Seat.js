const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    seatType: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["available", "reserved", "occupied"],
      default: "available",
    },
    activeBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Seat", seatSchema);
