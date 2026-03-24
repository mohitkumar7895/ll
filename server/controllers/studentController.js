const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Booking = require("../models/Booking");
const Attendance = require("../models/Attendance");
const FaceAttendance = require("../models/FaceAttendance");
const Payment = require("../models/Payment");
const Seat = require("../models/Seat");
const { broadcastSeatState } = require("../utils/realtime");
const { resolveUploadFilePath } = require("../utils/uploadPaths");

const unlinkProfilePhoto = (photoPath) => {
  const filePath = resolveUploadFilePath(photoPath);
  if (!filePath) {
    return;
  }
  fs.unlink(filePath, () => {});
};

const getMyProfile = async (req, res) => {
  return res.json({ user: req.user });
};

const updateMyProfile = async (req, res) => {
  const allowedFields = ["name", "phone", "email", "password"];

  allowedFields.forEach((field) => {
    if (req.body[field]) {
      req.user[field] = field === "email" ? req.body[field].toLowerCase() : req.body[field];
    }
  });

  if (req.file) {
    unlinkProfilePhoto(req.user.profilePhoto);
    unlinkProfilePhoto(req.user.profileImage);
    const nextPath = "/uploads/profiles/" + req.file.filename;
    req.user.profilePhoto = nextPath;
    req.user.profileImage = nextPath;
  }

  await req.user.save();
  return res.json({ message: "Profile updated successfully", user: req.user });
};

const getStudents = async (req, res) => {
  const students = await Student.find().sort({ createdAt: -1 });
  return res.json({ students });
};

const updateStudentByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid student id" });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, error: "Student not found" });
    }

    const { name, phone, email, password, penaltyAmount, subscriptionStatus } = req.body;

    if (email !== undefined && email.trim().toLowerCase() !== student.email) {
      const taken = await Student.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: id },
      });
      if (taken) {
        return res.status(409).json({ success: false, error: "Another student already uses this email" });
      }
      student.email = email.trim().toLowerCase();
    }

    if (name !== undefined) student.name = name.trim();
    if (phone !== undefined) student.phone = phone.trim();
    if (password !== undefined && password !== "") {
      if (String(password).length < 6) {
        return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
      }
      student.password = password;
    }
    if (penaltyAmount !== undefined && penaltyAmount !== "") {
      const n = Number(penaltyAmount);
      if (!Number.isFinite(n) || n < 0) {
        return res.status(400).json({ success: false, error: "Penalty must be a non-negative number" });
      }
      student.penaltyAmount = n;
    }
    if (subscriptionStatus !== undefined && ["active", "inactive"].includes(subscriptionStatus)) {
      student.subscriptionStatus = subscriptionStatus;
    }

    if (req.file) {
      unlinkProfilePhoto(student.profilePhoto);
      unlinkProfilePhoto(student.profileImage);
      const nextPath = "/uploads/profiles/" + req.file.filename;
      student.profilePhoto = nextPath;
      student.profileImage = nextPath;
    }

    await student.save();
    return res.json({ success: true, message: "Student updated", student });
  } catch (error) {
    console.error("Admin update student failed:", error.stack || error.message);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
};

const deleteStudentByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid student id" });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, error: "Student not found" });
    }

    const bookings = await Booking.find({ student: id });
    for (const booking of bookings) {
      const seat = await Seat.findById(booking.seat);
      if (seat && seat.activeBooking && String(seat.activeBooking) === String(booking._id)) {
        seat.status = "available";
        seat.activeBooking = null;
        await seat.save();
      }
    }

    await Booking.deleteMany({ student: id });
    await Attendance.deleteMany({ student: id });
    await FaceAttendance.deleteMany({ userId: id });
    await Payment.deleteMany({ student: id });

    unlinkProfilePhoto(student.profilePhoto);
    unlinkProfilePhoto(student.profileImage);
    await Student.findByIdAndDelete(id);

    await broadcastSeatState();

    return res.json({
      success: true,
      message: "Student removed — bookings, attendance, and payments deleted",
    });
  } catch (error) {
    console.error("Admin delete student failed:", error.stack || error.message);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getStudents,
  updateStudentByAdmin,
  deleteStudentByAdmin,
};
