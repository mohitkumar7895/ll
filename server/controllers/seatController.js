const mongoose = require("mongoose");
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
      seatType: typeof seatType === "string" ? seatType.trim() : "",
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

    const seatPrefix = String(prefix || "S").trim() || "S";
    const escaped = seatPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const seatsForPrefix = await Seat.find({ seatNumber: new RegExp("^" + escaped + "-") })
      .select("seatNumber")
      .lean();
    let maxN = 0;
    const numRe = new RegExp("^" + escaped + "-(\\d+)$");
    for (const s of seatsForPrefix) {
      const m = s.seatNumber.match(numRe);
      if (m) {
        maxN = Math.max(maxN, parseInt(m[1], 10));
      }
    }

    const typeStr = typeof seatType === "string" ? seatType.trim() : "";
    const seats = Array.from({ length: total }).map((_, index) => ({
      seatNumber: seatPrefix + "-" + String(maxN + index + 1).padStart(3, "0"),
      seatType: typeStr,
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

const deleteSeat = async (req, res) => {
  try {
    const seat = await Seat.findById(req.params.id);
    if (!seat) {
      return res.status(404).json({ success: false, error: "Seat not found" });
    }
    if (seat.status !== "available") {
      return res.status(400).json({
        success: false,
        error: "Seat is in use (reserved or occupied). Remove the booking first.",
      });
    }
    if (seat.activeBooking) {
      return res.status(400).json({
        success: false,
        error: "Seat still has a booking link. Refresh and try again.",
      });
    }

    await Seat.findByIdAndDelete(req.params.id);
    await broadcastSeatState();
    return res.json({ success: true, message: "Seat deleted" });
  } catch (error) {
    console.error("Deleting seat failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Failed to delete seat" });
  }
};

const bulkDeleteSeats = async (req, res) => {
  try {
    const { seatIds } = req.body;
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ success: false, error: "seatIds array is required" });
    }

    const uniqueValid = [
      ...new Set(seatIds.filter((id) => id != null && mongoose.Types.ObjectId.isValid(String(id))).map(String)),
    ];

    if (!uniqueValid.length) {
      return res.status(400).json({ success: false, error: "No valid seat IDs" });
    }

    const found = await Seat.find({ _id: { $in: uniqueValid } });
    const foundSet = new Set(found.map((s) => String(s._id)));
    const notFound = uniqueValid.filter((id) => !foundSet.has(id));

    const toDelete = [];
    const skipped = [];

    for (const seat of found) {
      if (seat.status !== "available") {
        skipped.push({ seatNumber: seat.seatNumber, reason: "not available (" + seat.status + ")" });
        continue;
      }
      if (seat.activeBooking) {
        skipped.push({ seatNumber: seat.seatNumber, reason: "has active booking link" });
        continue;
      }
      toDelete.push(seat._id);
    }

    let deletedCount = 0;
    if (toDelete.length) {
      const result = await Seat.deleteMany({ _id: { $in: toDelete } });
      deletedCount = result.deletedCount || 0;
      await broadcastSeatState();
    }

    const message =
      deletedCount +
      " seat(s) deleted" +
      (skipped.length ? " · " + skipped.length + " skipped (in use)" : "") +
      (notFound.length ? " · " + notFound.length + " ID(s) not found" : "");

    return res.json({
      success: true,
      message,
      deletedCount,
      skipped,
      notFoundCount: notFound.length,
    });
  } catch (error) {
    console.error("Bulk delete seats failed:", error.stack || error.message);
    return res.status(500).json({ success: false, error: error.message || "Failed to delete seats" });
  }
};

module.exports = {
  getSeats,
  createSeat,
  bulkCreateSeats,
  updateSeat,
  deleteSeat,
  bulkDeleteSeats,
};
