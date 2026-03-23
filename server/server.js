const path = require("path");
const fs = require("fs");
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

/**
 * Browser CORS allowlist (must match Origin header exactly; no trailing slash).
 * Do not throw from the cors origin callback — use callback(null, false) for disallowed origins.
 */
const allowedOrigins = ["https://ll-blue-xi.vercel.app"];

const corsAllowedMethods = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const corsAllowedHeaders = "Content-Type, Authorization";

/** Manual preflight — avoids app.options("*", ...) which breaks path-to-regexp in Express 5+. */
app.use((req, res, next) => {
  if (req.method !== "OPTIONS") {
    return next();
  }
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", corsAllowedMethods);
    res.setHeader("Access-Control-Allow-Headers", corsAllowedHeaders);
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }
  return res.status(204).end();
});

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

/** Browsers hit these on the API host; avoid 404 spam in logs (Vercel / serverless). */
app.get(["/favicon.ico", "/favicon.png"], (_req, res) => {
  res.status(204).end();
});

const faviconSvgCandidates = [
  path.join(__dirname, "..", "client", "public", "favicon.svg"),
  path.join(__dirname, "..", "client", "dist", "favicon.svg"),
];
app.get("/favicon.svg", (req, res) => {
  const found = faviconSvgCandidates.find((p) => fs.existsSync(p));
  if (found) {
    res.type("image/svg+xml");
    return res.sendFile(path.resolve(found));
  }
  res.status(204).end();
});

/**
 * Root URL on API-only deployments (e.g. Vercel server): redirect to frontend if CLIENT_URL is set.
 */
app.get("/", (req, res) => {
  const clientBase = (process.env.CLIENT_URL || "").trim().replace(/\/$/, "");
  if (clientBase) {
    return res.redirect(302, clientBase + "/");
  }
  return res.status(200).json({
    success: true,
    service: "Library Hub API",
    health: "/api/health",
    hint: "Open your Vite app URL for the UI. Set CLIENT_URL in env to redirect this root to the frontend.",
  });
});

/** Optional: serve built SPA from ../client/dist when present (same-origin deploy). */
const clientDist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(path.join(clientDist, "index.html"))) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) {
        next(err);
      }
    });
  });
}

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
