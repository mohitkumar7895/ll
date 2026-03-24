/** Revenue / success states (cash pending excluded). */
const revenueStatuses = new Set(["paid", "ONLINE_SUCCESS", "CASH_RECEIVED"]);

/** Receipt page allowed. */
const receiptStatuses = new Set(["paid", "ONLINE_SUCCESS", "CASH_PENDING", "CASH_RECEIVED"]);

const isPaidLike = (status) => status === "paid" || status === "ONLINE_SUCCESS" || status === "CASH_RECEIVED";

const countsTowardRevenue = (status) => revenueStatuses.has(status);

const canViewReceipt = (status) => receiptStatuses.has(status);

module.exports = {
  revenueStatuses,
  receiptStatuses,
  isPaidLike,
  countsTowardRevenue,
  canViewReceipt,
};
