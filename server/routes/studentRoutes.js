const express = require("express");
const {
  getMyProfile,
  updateMyProfile,
  getStudents,
  updateStudentByAdmin,
  deleteStudentByAdmin,
} = require("../controllers/studentController");
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/me", protect, authorize("student"), getMyProfile);
router.put("/me", protect, authorize("student"), upload.uploadProfileFlexible, updateMyProfile);
router.get("/", protect, authorize("admin"), getStudents);
router.put("/:id", protect, authorize("admin"), upload.uploadProfileFlexible, updateStudentByAdmin);
router.delete("/:id", protect, authorize("admin"), deleteStudentByAdmin);

module.exports = router;
