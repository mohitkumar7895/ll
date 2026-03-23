const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

const pad = (value) => String(value).padStart(2, "0");

const getAttendanceDate = (date = new Date()) => {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");
};

const calculateTotalHours = (checkInTime, checkOutTime) => {
  if (!checkInTime || !checkOutTime) {
    return 0;
  }

  return Number((((checkOutTime - checkInTime) / (1000 * 60 * 60))).toFixed(2));
};

const getTodayAttendanceRecords = async (attendanceDate = getAttendanceDate()) => {
  const [students, attendance] = await Promise.all([
    Student.find().select("name email studentId rollNo").sort({ name: 1 }).lean(),
    Attendance.find({ attendanceDate })
      .populate("student", "name email studentId rollNo")
      .populate("seat", "seatNumber seatType")
      .sort({ checkInTime: -1 })
      .lean(),
  ]);

  const attendanceByStudent = new Map(
    attendance.map((entry) => [String(entry.student?._id || entry.student), entry])
  );

  return students.map((student) => {
    const existingEntry = attendanceByStudent.get(String(student._id));
    if (existingEntry) {
      return existingEntry;
    }

    return {
      _id: `absent-${student._id}-${attendanceDate}`,
      student,
      seat: null,
      attendanceDate,
      checkInTime: null,
      checkOutTime: null,
      totalHours: 0,
      status: "Absent",
    };
  });
};

module.exports = {
  getAttendanceDate,
  calculateTotalHours,
  getTodayAttendanceRecords,
};
