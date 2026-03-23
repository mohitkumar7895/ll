const Seat = require("../models/Seat");
const { getIO } = require("../socket");

const broadcastSeatState = async () => {
  try {
    const seats = await Seat.find().sort({ seatNumber: 1 });
    getIO().emit("seats:updated", seats);
  } catch (error) {
    console.error("Failed to broadcast seat state:", error.message);
  }
};

const broadcastAttendanceUpdate = (payload) => {
  try {
    getIO().emit("attendanceUpdated", payload);
  } catch (error) {
    console.error("Failed to broadcast attendance update:", error.message);
  }
};

const broadcastPaymentsUpdate = (payload) => {
  try {
    getIO().emit("paymentsUpdated", payload);
  } catch (error) {
    console.error("Failed to broadcast payments update:", error.message);
  }
};

module.exports = {
  broadcastSeatState,
  broadcastAttendanceUpdate,
  broadcastPaymentsUpdate,
};
