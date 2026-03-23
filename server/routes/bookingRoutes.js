const express = require("express");
const { getMyBookings, createBooking, cancelBooking } = require("../controllers/bookingController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getMyBookings);
router.post("/", protect, authorize("student"), createBooking);
router.patch("/:id/cancel", protect, cancelBooking);

module.exports = router;
