/** Local calendar date YYYY-MM-DD (align with server getAttendanceDate). */
export const getTodayDateString = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join("-");
};

export const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
};

export const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString();
};

export const formatTime = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleTimeString();
};

export const formatHours = (value) => Number(value || 0).toFixed(2) + " hrs";

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0) / 100);
