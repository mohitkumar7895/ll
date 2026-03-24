const Booking = require("../models/Booking");
const Seat = require("../models/Seat");
const Attendance = require("../models/Attendance");
const { getBookingOption } = require("../utils/bookingDurations");
const { broadcastSeatState } = require("../utils/realtime");
const { sendEmail } = require("../utils/email");
const { calculateTotalHours } = require("../utils/attendance");

const getMyBookings = async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { student: req.user._id };
    const bookings = await Booking.find(query)
      .populate("seat", "seatNumber seatType status")
      .populate("student", "name email studentId")
      .sort({ createdAt: -1 });

    return res.json({ success: true, bookings });
  } catch (error) {
    console.error("Fetching bookings failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Failed to fetch bookings" });
  }
};

const createBooking = async (req, res) => {
  console.log("POST /api/bookings req.body:", req.body);

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

    await sendEmail({
      to: req.user.email,
      subject: "Library seat reserved",
      text: "Your booking for seat " + seat.seatNumber + " has been confirmed until " + endTime.toLocaleString() + ".",
    });

    await broadcastSeatState();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("seat", "seatNumber seatType status")
      .populate("student", "name email studentId");

    return res.status(201).json({
      success: true,
      message: "Seat booked successfully. Please check in when you arrive.",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error("Creating booking failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Failed to create booking" });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("seat");
    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    const isOwner = booking.student.toString() === req.user._id.toString();
    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({ success: false, error: "You can only cancel your own bookings" });
    }

    if (!["reserved", "active"].includes(booking.status)) {
      return res.status(400).json({ success: false, error: "Only active or reserved bookings can be cancelled" });
    }

    const activeAttendance = await Attendance.findOne({
      booking: booking._id,
      checkInTime: { $ne: null },
      checkOutTime: null,
    });
    if (activeAttendance) {
      activeAttendance.checkOutTime = new Date();
      activeAttendance.totalHours = calculateTotalHours(activeAttendance.checkInTime, activeAttendance.checkOutTime);
      activeAttendance.status = "Present";
      await activeAttendance.save();
    }

    booking.status = "cancelled";
    booking.checkedOutAt = new Date();
    await booking.save();

    if (booking.seat) {
      booking.seat.status = "available";
      booking.seat.activeBooking = null;
      await booking.seat.save();
    }

    await broadcastSeatState();
    return res.json({ success: true, message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Cancelling booking failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Failed to cancel booking" });
  }
};

module.exports = {
  getMyBookings,
  createBooking,
  cancelBooking,
};
