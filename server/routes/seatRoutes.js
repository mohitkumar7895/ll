const express = require("express");
const { getSeats, createSeat, bulkCreateSeats, updateSeat } = require("../controllers/seatController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getSeats);
router.post("/", protect, authorize("admin"), createSeat);
router.post("/bulk", protect, authorize("admin"), bulkCreateSeats);
router.put("/:id", protect, authorize("admin"), updateSeat);

module.exports = router;
