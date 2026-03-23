const Seat = require("../models/Seat");
const { broadcastSeatState } = require("../utils/realtime");

const getSeats = async (req, res) => {
  try {
    const seats = await Seat.find().sort({ seatNumber: 1 });
    return res.json({ success: true, seats });
  } catch (error) {
    console.error("Fetching seats failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Failed to fetch seats" });
  }
};

const createSeat = async (req, res) => {
  try {
    const { seatNumber, seatType } = req.body;

    if (!seatNumber) {
      return res.status(400).json({ success: false, error: "Seat number is required" });
    }

    const seat = await Seat.create({
      seatNumber,
      seatType: seatType || "Regular",
    });

    await broadcastSeatState();
    return res.status(201).json({ success: true, message: "Seat created successfully", seat });
  } catch (error) {
    console.error("Creating seat failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Failed to create seat" });
  }
};

const bulkCreateSeats = async (req, res) => {
  try {
    const { count, seatType, prefix } = req.body;
    const total = Number(count || 0);

    if (!total || total < 1) {
      return res.status(400).json({ success: false, error: "Count must be greater than 0" });
    }

    const existingSeats = await Seat.find().sort({ createdAt: 1 });
    const startIndex = existingSeats.length + 1;
    const seatPrefix = prefix || "S";

    const seats = Array.from({ length: total }).map((_, index) => ({
      seatNumber: seatPrefix + "-" + String(startIndex + index).padStart(3, "0"),
      seatType: seatType || "Regular",
    }));

    const createdSeats = await Seat.insertMany(seats, { ordered: false });
    await broadcastSeatState();

    return res.status(201).json({
      success: true,
      message: String(createdSeats.length) + " seats created successfully",
      seats: createdSeats,
    });
  } catch (error) {
    console.error("Bulk seat creation failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Failed to create seats" });
  }
};

const updateSeat = async (req, res) => {
  try {
    const seat = await Seat.findById(req.params.id);
    if (!seat) {
      return res.status(404).json({ success: false, error: "Seat not found" });
    }

    const { seatNumber, seatType } = req.body;
    if (seatNumber) {
      seat.seatNumber = seatNumber;
    }
    if (seatType) {
      seat.seatType = seatType;
    }

    await seat.save();
    await broadcastSeatState();
    return res.json({ success: true, message: "Seat updated successfully", seat });
  } catch (error) {
    console.error("Updating seat failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Failed to update seat" });
  }
};

module.exports = {
  getSeats,
  createSeat,
  bulkCreateSeats,
  updateSeat,
};
