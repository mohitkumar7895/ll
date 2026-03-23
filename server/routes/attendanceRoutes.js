const express = require("express");
const { getMyAttendance, getTodayAttendance, checkIn, checkOut } = require("../controllers/attendanceController");
const {
  markFaceAttendance,
  markFaceAttendanceAsAdmin,
  getStudentFaceToday,
  getAllFaceAttendance,
} = require("../controllers/faceAttendanceController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/mark", protect, authorize("student"), markFaceAttendance);
router.post("/mark/admin", protect, authorize("admin"), markFaceAttendanceAsAdmin);
router.get("/face/today/:studentId", protect, authorize("admin"), getStudentFaceToday);
router.get("/all", protect, authorize("admin"), getAllFaceAttendance);
router.get("/", protect, getMyAttendance);
router.get("/today", protect, authorize("admin"), getTodayAttendance);
router.post("/check-in", protect, authorize("student"), checkIn);
router.post("/check-out", protect, authorize("student"), checkOut);

module.exports = router;
