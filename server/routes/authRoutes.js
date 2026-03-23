const express = require("express");
const { signupStudent, loginStudent, loginAdmin, getCurrentUser } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/student/signup", upload.uploadProfileFlexible, signupStudent);
router.post("/student/login", loginStudent);
router.post("/admin/login", loginAdmin);
router.get("/me", protect, getCurrentUser);

module.exports = router;
