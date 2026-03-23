const Student = require("../models/Student");
const Seat = require("../models/Seat");
const Booking = require("../models/Booking");
const Attendance = require("../models/Attendance");
const FaceAttendance = require("../models/FaceAttendance");
const Payment = require("../models/Payment");
const { getAttendanceDate, getTodayAttendanceRecords } = require("../utils/attendance");

const getAdminDashboard = async (req, res) => {
  const attendanceDate = getAttendanceDate();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [
    totalStudents,
    occupiedSeats,
    reservedSeats,
    availableSeats,
    activeBookings,
    peakHours,
    recentBookings,
    todayAttendanceRecords,
    paymentSummary,
    recentPayments,
  ] =
    await Promise.all([
      Student.countDocuments(),
      Seat.countDocuments({ status: "occupied" }),
      Seat.countDocuments({ status: "reserved" }),
      Seat.countDocuments({ status: "available" }),
      Booking.countDocuments({ status: { $in: ["reserved", "active"] }, endTime: { $gt: new Date() } }),
      Attendance.aggregate([
        { $match: { attendanceDate, checkInTime: { $gte: startOfDay, $lte: endOfDay } } },
        {
          $group: {
            _id: { $hour: "$checkInTime" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 5 },
      ]),
      Booking.find()
        .populate("seat", "seatNumber seatType")
        .populate("student", "name studentId")
        .sort({ createdAt: -1 })
        .limit(6),
      getTodayAttendanceRecords(attendanceDate),
      Payment.aggregate([
        { $match: { status: "paid" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
            totalPayments: { $sum: 1 },
          },
        },
      ]),
      Payment.find()
        .populate("student", "name studentId email")
        .populate("seat", "seatNumber seatType")
        .populate("booking", "status")
        .sort({ createdAt: -1 })
        .limit(8),
    ]);

  const todayAttendance = todayAttendanceRecords.filter((entry) => entry.status === "Present").length;
  const revenueStats = paymentSummary[0] || { totalRevenue: 0, totalPayments: 0 };

  return res.json({
    success: true,
    stats: {
      totalStudents,
      totalSeats: availableSeats + reservedSeats + occupiedSeats,
      occupiedSeats,
      reservedSeats,
      availableSeats,
      todayAttendance,
      activeBookings,
      totalRevenue: revenueStats.totalRevenue,
      totalPayments: revenueStats.totalPayments,
    },
    peakHours,
    recentBookings,
    todayAttendanceRecords,
    recentPayments,
  });
};

const getStudentDashboard = async (req, res) => {
  const attendanceDate = getAttendanceDate();
  const [
    activeBooking,
    activeAttendance,
    recentBookings,
    recentAttendance,
    totalHoursData,
    paymentSummary,
    recentPayments,
    todayFaceAttendance,
  ] = await Promise.all([
    Booking.findOne({
      student: req.user._id,
      status: { $in: ["reserved", "active"] },
      endTime: { $gt: new Date() },
    })
      .populate("seat", "seatNumber seatType status")
      .sort({ endTime: 1 }),
    Attendance.findOne({
      student: req.user._id,
      attendanceDate,
      checkInTime: { $ne: null },
      checkOutTime: null,
    }).populate("seat", "seatNumber seatType"),
    Booking.find({ student: req.user._id })
      .populate("seat", "seatNumber seatType status")
      .sort({ createdAt: -1 })
      .limit(6),
    Attendance.find({ student: req.user._id })
      .populate("seat", "seatNumber seatType")
      .sort({ attendanceDate: -1, checkInTime: -1 })
      .limit(6),
    Attendance.aggregate([
      { $match: { student: req.user._id, status: "Present", checkOutTime: { $ne: null } } },
      { $group: { _id: null, totalHours: { $sum: "$totalHours" }, visits: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { student: req.user._id, status: "paid" } },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: "$amount" },
          totalPayments: { $sum: 1 },
        },
      },
    ]),
    Payment.find({ student: req.user._id })
      .populate("seat", "seatNumber seatType")
      .populate("booking", "status startTime endTime")
      .sort({ createdAt: -1 })
      .limit(6),
    FaceAttendance.findOne({ userId: req.user._id, date: attendanceDate }).lean(),
  ]);

  const totals = totalHoursData[0] || { totalHours: 0, visits: 0 };
  const paymentStats = paymentSummary[0] || { totalSpent: 0, totalPayments: 0 };

  return res.json({
    success: true,
    student: req.user,
    activeBooking,
    activeAttendance,
    todayFaceAttendance,
    recentBookings,
    recentAttendance,
    recentPayments,
    stats: {
      totalHours: Number((totals.totalHours || 0).toFixed(2)),
      totalVisits: totals.visits || 0,
      penalties: req.user.penaltyAmount || 0,
      totalPayments: paymentStats.totalPayments || 0,
      totalSpent: paymentStats.totalSpent || 0,
    },
  });
};

module.exports = {
  getAdminDashboard,
  getStudentDashboard,
};
