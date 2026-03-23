const express = require("express");
const { getPayments, getPaymentConfig, createOrder, verifyPayment } = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/config", protect, getPaymentConfig);
router.get("/", protect, getPayments);
router.post("/create-order", protect, authorize("student"), createOrder);
router.post("/verify", protect, authorize("student"), verifyPayment);

module.exports = router;
