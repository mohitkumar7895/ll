import api from "./api";

export const fetchStudentDashboard = async () => (await api.get("/dashboard/student")).data;
export const fetchAdminDashboard = async () => (await api.get("/dashboard/admin")).data;
export const fetchSeats = async () => (await api.get("/seats")).data;
export const fetchStudents = async () => (await api.get("/students")).data;

/** Student: multipart FormData — text fields + optional profileImage */
export const updateMyStudentProfile = async (formData) => (await api.put("/students/me", formData)).data;

/** Admin: multipart FormData (text fields + optional profileImage / profilePhoto file) */
export const updateStudentAsAdmin = async (studentId, formData) =>
  (await api.put("/students/" + studentId, formData)).data;

export const deleteStudentAsAdmin = async (studentId) => (await api.delete("/students/" + studentId)).data;
export const fetchBookings = async () => (await api.get("/bookings")).data;
export const fetchAttendance = async () => (await api.get("/attendance")).data;
export const fetchTodayAttendance = async () => (await api.get("/attendance/today")).data;
export const fetchFaceAttendanceAll = async () => (await api.get("/attendance/all")).data;
export const fetchStudentFaceToday = async (studentId) => (await api.get("/attendance/face/today/" + studentId)).data;
export const markFaceAttendance = async () => (await api.post("/attendance/mark")).data;
export const markFaceAttendanceAsAdmin = async (studentId) =>
  (await api.post("/attendance/mark/admin", { studentId })).data;
export const createBooking = async (payload) => (await api.post("/bookings", payload)).data;
export const cancelBooking = async (bookingId) => (await api.patch("/bookings/" + bookingId + "/cancel")).data;
/** All payment REST paths use singular `/payment` → server `app.use("/api/payment", ...)`. */
export const fetchPayments = async (params) => (await api.get("/payment", { params: params || {} })).data;
export const fetchPaymentConfig = async () => (await api.get("/payment/config")).data;
export const createPaymentOrder = async (payload) => (await api.post("/payment/create-order", payload)).data;
export const verifyPayment = async (payload) => (await api.post("/payment/verify", payload)).data;
/** Admin only — body: `{ studentId, seatId, durationKey }` → cash booking (CASH_RECEIVED). */
export const adminCreateCashBooking = async (payload) => {
  try {
    const res = await api.post("/payment/cash", payload);
    return res.data;
  } catch (err) {
    console.error("Cash booking error:", err);
    throw err;
  }
};
export const markCashPaymentPaid = async (paymentId) => (await api.put("/payment/mark-paid/" + paymentId)).data;
export const fetchPaymentById = async (paymentId) => (await api.get("/payment/" + paymentId)).data;
export const checkIn = async () => (await api.post("/attendance/check-in")).data;
export const checkOut = async () => (await api.post("/attendance/check-out")).data;
export const createSeat = async (payload) => (await api.post("/seats", payload)).data;
export const bulkCreateSeats = async (payload) => (await api.post("/seats/bulk", payload)).data;
