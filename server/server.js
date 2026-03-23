const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const cron = require("node-cron");

const connectDB = require("./config/db");
const seedDefaultAdmin = require("./utils/seedAdmin");
const seedDefaultSeats = require("./utils/seedSeats");
const Booking = require("./models/Booking");
const Attendance = require("./models/Attendance");
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const seatRoutes = require("./routes/seatRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { getUploadBaseDir } = require("./utils/uploadPaths");
const { initializeSocket } = require("./socket");
const { broadcastSeatState } = require("./utils/realtime");
const { calculateTotalHours } = require("./utils/attendance");

dotenv.config();

const app = express();
const server = http.createServer(app);
initializeSocket(server);
app.disable("etag");

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://localhost:5173",
  "https://localhost:5174",
  "https://127.0.0.1:5173",
  "https://127.0.0.1:5174",
  ...((process.env.CLIENT_URL || "").split(",").map((origin) => origin.trim()).filter(Boolean)),
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS policy blocked this origin: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan("dev"));
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});
app.use("/uploads", express.static(getUploadBaseDir()));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Library API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentRoutes);

app.use(notFound);
app.use(errorHandler);

const releaseExpiredSeats = async () => {
  const now = new Date();
  const expiredBookings = await Booking.find({
    endTime: { $lte: now },
    status: { $in: ["reserved", "active"] },
  }).populate("seat student");

  for (const booking of expiredBookings) {
    const activeAttendance = await Attendance.findOne({
      booking: booking._id,
      checkInTime: { $ne: null },
      checkOutTime: null,
    });

    if (activeAttendance) {
      activeAttendance.checkOutTime = booking.endTime;
      activeAttendance.totalHours = calculateTotalHours(activeAttendance.checkInTime, activeAttendance.checkOutTime);
      activeAttendance.status = "Present";
      await activeAttendance.save();
      booking.status = "expired";
      booking.checkedOutAt = booking.endTime;
    } else {
      booking.status = "no-show";
      const penalty = Number(process.env.NO_SHOW_PENALTY || 50);
      if (booking.student) {
        booking.student.penaltyAmount += penalty;
        await booking.student.save();
      }
    }

    if (booking.seat) {
      booking.seat.status = "available";
      booking.seat.activeBooking = null;
      await booking.seat.save();
    }

    await booking.save();
  }

  if (expiredBookings.length > 0) {
    await broadcastSeatState();
    console.log("Released " + expiredBookings.length + " expired booking(s)");
  }
};

const startServer = async () => {
  try {
    await connectDB();
    await seedDefaultAdmin();
    await seedDefaultSeats();
    await broadcastSeatState();

    cron.schedule("* * * * *", async () => {
      try {
        await releaseExpiredSeats();
      } catch (error) {
        console.error("Cron job failed:", error.stack || error.message);
      }
    });

    const port = Number(process.env.PORT || 5000);
    server.listen(port, () => {
      console.log("Server running on port " + port);
      console.log("Allowed CORS origins:", allowedOrigins.join(", "));
    });
  } catch (error) {
    console.error("Server startup failed:", error.stack || error.message);
    process.exit(1);
  }
};

startServer();
