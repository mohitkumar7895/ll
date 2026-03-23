const { Server } = require("socket.io");

let io;

const initializeSocket = (httpServer) => {
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

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Socket CORS blocked this origin: " + origin));
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized");
  }

  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};
