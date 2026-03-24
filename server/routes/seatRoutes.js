const express = require("express");
const {
  getSeats,
  createSeat,
  bulkCreateSeats,
  bulkDeleteSeats,
  updateSeat,
  deleteSeat,
} = require("../controllers/seatController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getSeats);
router.post("/", protect, authorize("admin"), createSeat);
router.post("/bulk", protect, authorize("admin"), bulkCreateSeats);
router.post("/bulk-delete", protect, authorize("admin"), bulkDeleteSeats);
router.put("/:id", protect, authorize("admin"), updateSeat);
router.delete("/:id", protect, authorize("admin"), deleteSeat);

module.exports = router;
