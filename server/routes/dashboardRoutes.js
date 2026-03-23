const express = require("express");
const { getAdminDashboard, getStudentDashboard } = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/admin", protect, authorize("admin"), getAdminDashboard);
router.get("/student", protect, authorize("student"), getStudentDashboard);

module.exports = router;
