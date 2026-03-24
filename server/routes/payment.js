const express = require("express");
const {
  getPayments,
  getPaymentConfig,
  createOrder,
  verifyPayment,
  getPaymentById,
  markCashPaid,
} = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/config", protect, getPaymentConfig);
router.get("/", protect, getPayments);
router.post("/create-order", protect, authorize("student"), createOrder);
router.post("/verify", protect, authorize("student"), verifyPayment);

/** POST /cash is registered on `app` in server.js (admin-only cash booking). */

router.put("/mark-paid/:id", protect, authorize("admin"), markCashPaid);

/** GET — verify route is mounted (browser test). POST /cash is the real cash booking (auth required). */
router.get("/cash", (req, res) => {
  console.log("Cash route hit (GET /api/payment/cash)");
  res.json({
    success: true,
    message: "Cash payment route OK — use POST with seatId, durationKey, and Authorization: Bearer <token>",
  });
});

router.get("/:id", protect, getPaymentById);

module.exports = router;
