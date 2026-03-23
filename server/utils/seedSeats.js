const Seat = require("../models/Seat");

const TARGET_SEAT_COUNT = 100;
const SEAT_TYPES = ["Regular", "AC", "Silent", "Group"];

const buildSeatPlan = (existingSeatNumbers, countToCreate) => {
  const seats = [];
  let sequence = 1;

  while (seats.length < countToCreate) {
    const seatNumber = "S-" + String(sequence).padStart(3, "0");
    if (!existingSeatNumbers.has(seatNumber)) {
      seats.push({
        seatNumber,
        seatType: SEAT_TYPES[(sequence - 1) % SEAT_TYPES.length],
      });
    }
    sequence += 1;
  }

  return seats;
};

const seedDefaultSeats = async () => {
  const existingSeats = await Seat.find({}, "seatNumber").lean();
  const existingSeatNumbers = new Set(existingSeats.map((seat) => seat.seatNumber));

  if (existingSeats.length >= TARGET_SEAT_COUNT) {
    console.log("Seat inventory already has " + existingSeats.length + " seats");
    return;
  }

  const seatsToCreate = TARGET_SEAT_COUNT - existingSeats.length;
  const generatedSeats = buildSeatPlan(existingSeatNumbers, seatsToCreate);

  await Seat.insertMany(generatedSeats);
  console.log("Seeded " + generatedSeats.length + " seats. Total seats available: " + TARGET_SEAT_COUNT);
};

module.exports = seedDefaultSeats;
