/** Aligns with server payment statuses */
export const isReceiptAvailable = (status) =>
  ["paid", "ONLINE_SUCCESS", "CASH_PENDING", "CASH_RECEIVED"].includes(status);

/** Counts toward “money collected” totals */
export const isCollectedPayment = (status) =>
  ["paid", "ONLINE_SUCCESS", "CASH_RECEIVED"].includes(status);

export const paymentMethodLabel = (p) => {
  if (p?.paymentMethod === "CASH") return "Cash";
  return "Online";
};
