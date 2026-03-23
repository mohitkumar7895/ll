const mongoose = require("mongoose");
const FaceAttendance = require("../models/FaceAttendance");
const Student = require("../models/Student");
const { getAttendanceDate } = require("../utils/attendance");
const { getIO } = require("../socket");
const { broadcastAttendanceUpdate } = require("../utils/realtime");

const formatTime = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const parseDateTimeMs = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) {
    return NaN;
  }
  const t = new Date(`${dateStr}T${timeStr}`);
  return t.getTime();
};

const emitFaceSockets = (record) => {
  try {
    getIO().emit("faceAttendanceUpdated", { action: "marked", attendance: record });
  } catch (_) {
    /* ignore */
  }
};

/**
 * Core face check-in / check-out for a student userId.
 * @returns {{ statusCode: number, payload: object }}
 */
const executeFaceMark = async (userId) => {
  const student = await Student.findById(userId);
  if (!student) {
    return {
      statusCode: 404,
      payload: { success: false, error: "Student not found" },
    };
  }

  const imagePath = (student.profileImage || student.profilePhoto || "").trim();
  if (!imagePath) {
    return {
      statusCode: 400,
      payload: {
        success: false,
        error: "This student has no profile photo. Add one from Students or ask the student to upload.",
      },
    };
  }

  const date = getAttendanceDate();
  const now = new Date();
  const timeStr = formatTime(now);

  const existing = await FaceAttendance.findOne({ userId, date });

  if (!existing) {
    const record = await FaceAttendance.create({
      userId,
      name: student.name,
      date,
      time: timeStr,
      checkOutTime: null,
      totalFaceHours: null,
      status: "Present",
    });

    emitFaceSockets(record);
    broadcastAttendanceUpdate({
      action: "face-check-in",
      userId: String(userId),
      attendanceDate: date,
      faceAttendance: record,
    });

    return {
      statusCode: 201,
      payload: {
        success: true,
        action: "face-check-in",
        message: "Face check-in recorded — scan again to check out.",
        attendance: record,
      },
    };
  }

  if (!existing.checkOutTime) {
    const inMs = parseDateTimeMs(date, existing.time);
    const outMs = parseDateTimeMs(date, timeStr);
    let totalFaceHours = 0;
    if (!Number.isNaN(inMs) && !Number.isNaN(outMs) && outMs > inMs) {
      totalFaceHours = Number(((outMs - inMs) / (1000 * 60 * 60)).toFixed(2));
    }

    existing.checkOutTime = timeStr;
    existing.totalFaceHours = totalFaceHours;
    await existing.save();

    emitFaceSockets(existing);
    broadcastAttendanceUpdate({
      action: "face-check-out",
      userId: String(userId),
      attendanceDate: date,
      faceAttendance: existing,
    });

    return {
      statusCode: 200,
      payload: {
        success: true,
        action: "face-check-out",
        message: "Face check-out recorded — session complete for today.",
        attendance: existing,
      },
    };
  }

  return {
    statusCode: 400,
    payload: {
      success: false,
      error: "Face attendance already completed for today (check-in and check-out done).",
    },
  };
};

const markFaceAttendance = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ success: false, error: "Only students can use this endpoint" });
    }

    const { statusCode, payload } = await executeFaceMark(req.user._id);
    return res.status(statusCode).json(payload);
  } catch (error) {
    console.error("markFaceAttendance failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Failed to mark attendance" });
  }
};

const markFaceAttendanceAsAdmin = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admins only" });
    }

    const studentId = req.body?.studentId || req.params?.studentId;
    if (!studentId || !mongoose.Types.ObjectId.isValid(String(studentId))) {
      return res.status(400).json({ success: false, error: "Valid studentId is required" });
    }

    const { statusCode, payload } = await executeFaceMark(studentId);
    return res.status(statusCode).json(payload);
  } catch (error) {
    console.error("markFaceAttendanceAsAdmin failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Failed to mark attendance" });
  }
};

const getStudentFaceToday = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admins only" });
    }

    const { studentId } = req.params;
    if (!studentId || !mongoose.Types.ObjectId.isValid(String(studentId))) {
      return res.status(400).json({ success: false, error: "Invalid student id" });
    }

    const date = getAttendanceDate();
    const record = await FaceAttendance.findOne({ userId: studentId, date }).lean();

    return res.json({ success: true, record: record || null });
  } catch (error) {
    console.error("getStudentFaceToday failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Failed to fetch status" });
  }
};

const getAllFaceAttendance = async (req, res) => {
  try {
    const attendance = await FaceAttendance.find()
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    return res.json({ success: true, attendance });
  } catch (error) {
    console.error("getAllFaceAttendance failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Failed to fetch attendance" });
  }
};

module.exports = {
  markFaceAttendance,
  markFaceAttendanceAsAdmin,
  getStudentFaceToday,
  getAllFaceAttendance,
};
