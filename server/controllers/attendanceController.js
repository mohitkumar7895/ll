const Attendance = require("../models/Attendance");
const Booking = require("../models/Booking");
const FaceAttendance = require("../models/FaceAttendance");
const { broadcastSeatState, broadcastAttendanceUpdate } = require("../utils/realtime");
const { sendEmail } = require("../utils/email");
const { calculateTotalHours, getAttendanceDate, getTodayAttendanceRecords } = require("../utils/attendance");

const populateAttendanceQuery = (query) =>
  query.populate("seat", "seatNumber seatType").populate("student", "name email studentId");

const findTodayAttendance = async (studentId, attendanceDate) =>
  populateAttendanceQuery(
    Attendance.findOne({
      student: studentId,
      attendanceDate,
    }).populate("booking")
  );

const getLatestBookingForStudent = async (studentId) => {
  return Booking.findOne({
    student: studentId,
    status: { $in: ["reserved", "active"] },
    endTime: { $gt: new Date() },
  })
    .sort({ endTime: 1 })
    .populate("seat");
};

const finalizeBookingAndSeat = async (attendance, timestamp) => {
  const booking = attendance.booking
    ? attendance.booking
    : await Booking.findById(attendance.booking || attendance.booking?._id).populate("seat");

  if (booking) {
    booking.status = "completed";
    booking.checkedOutAt = timestamp;
    await booking.save();
  }

  const seat = attendance.seat
    ? attendance.seat
    : booking?.seat || null;

  if (seat) {
    seat.status = "available";
    seat.activeBooking = null;
    await seat.save();
  }
};

const createCheckInRecord = async (student, source) => {
  const attendanceDate = getAttendanceDate();
  const timestamp = new Date();
  const booking = await getLatestBookingForStudent(student._id);

  const attendance = await Attendance.create({
    student: student._id,
    booking: booking?._id || null,
    seat: booking?.seat?._id || null,
    attendanceDate,
    checkInTime: timestamp,
    status: "Present",
  });

  if (booking) {
    booking.status = "active";
    booking.checkedInAt = timestamp;
    await booking.save();

    if (booking.seat) {
      booking.seat.status = "reserved";
      booking.seat.activeBooking = booking._id;
      await booking.seat.save();
    }
  }

  const populatedAttendance = await populateAttendanceQuery(
    Attendance.findById(attendance._id)
  );

  await sendEmail({
    to: student.email,
    subject: "Attendance checked in",
    text: "You checked in successfully at " + timestamp.toLocaleTimeString() + ".",
  });

  await broadcastSeatState();
  broadcastAttendanceUpdate({
    action: "check-in",
    userId: String(student._id),
    attendanceDate,
    attendance: populatedAttendance,
    source,
  });

  return {
    action: "check-in",
    message: "Check-in successful",
    attendance: populatedAttendance,
  };
};

const completeCheckOutRecord = async (student, attendance, source) => {
  const timestamp = new Date();
  attendance.checkOutTime = timestamp;
  attendance.totalHours = calculateTotalHours(attendance.checkInTime, timestamp);
  attendance.status = "Present";
  await attendance.save();

  await finalizeBookingAndSeat(attendance, timestamp);

  const populatedAttendance = await populateAttendanceQuery(
    Attendance.findById(attendance._id)
  );

  await sendEmail({
    to: student.email,
    subject: "Attendance checked out",
    text: "You checked out successfully. Total time: " + attendance.totalHours + " hours.",
  });

  await broadcastSeatState();
  broadcastAttendanceUpdate({
    action: "check-out",
    userId: String(student._id),
    attendanceDate: attendance.attendanceDate,
    attendance: populatedAttendance,
    source,
  });

  return {
    action: "check-out",
    message: "Check-out successful",
    attendance: populatedAttendance,
  };
};

const getMyAttendance = async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { student: req.user._id };
    const attendance = await populateAttendanceQuery(
      Attendance.find(query).sort({ attendanceDate: -1, checkInTime: -1 })
    );

    let faceAttendance = [];
    if (req.user.role === "student") {
      faceAttendance = await FaceAttendance.find({ userId: req.user._id })
        .sort({ date: -1, createdAt: -1 })
        .lean();
    }

    return res.json({ success: true, attendance, faceAttendance });
  } catch (error) {
    console.error("Fetching attendance failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Failed to fetch attendance" });
  }
};

const getTodayAttendance = async (req, res) => {
  try {
    const attendance = await getTodayAttendanceRecords();
    return res.json({ success: true, attendance });
  } catch (error) {
    console.error("Fetching today's attendance failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Failed to fetch today's attendance" });
  }
};

const checkIn = async (req, res) => {
  try {
    const todayAttendance = await findTodayAttendance(req.user._id, getAttendanceDate());

    if (todayAttendance?.checkInTime && !todayAttendance.checkOutTime) {
      return res.status(400).json({ success: false, error: "You already have an active check-in for today" });
    }

    if (todayAttendance?.checkOutTime) {
      return res.status(400).json({ success: false, error: "Today's attendance is already completed" });
    }

    const result = await createCheckInRecord(req.user, "manual");
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    console.error("Manual check-in failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Check-in failed" });
  }
};

const checkOut = async (req, res) => {
  try {
    const attendance = await findTodayAttendance(req.user._id, getAttendanceDate());

    if (!attendance?.checkInTime || attendance.checkOutTime) {
      return res.status(400).json({ success: false, error: "No active attendance found for check-out" });
    }

    const result = await completeCheckOutRecord(req.user, attendance, "manual");
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("Manual check-out failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Check-out failed" });
  }
};

module.exports = {
  getMyAttendance,
  getTodayAttendance,
  checkIn,
  checkOut,
};
