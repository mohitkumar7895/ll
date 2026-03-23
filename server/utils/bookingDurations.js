const BOOKING_OPTIONS = {
  "full-day": { label: "Full day", minutes: 12 * 60, amount: 9900, currency: "INR" },
  monthly: { label: "Monthly", minutes: 30 * 24 * 60, amount: 199900, currency: "INR" },
};

const getBookingOption = (key) => BOOKING_OPTIONS[key] || null;

module.exports = {
  BOOKING_OPTIONS,
  getBookingOption,
};
