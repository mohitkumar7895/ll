const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.originalUrl}`,
  });
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  if (statusCode >= 500) {
    console.error("Unhandled error:", err.stack || err.message);
  }

  res.status(statusCode).json({
    success: false,
    error: err.message || "Server error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

module.exports = {
  notFound,
  errorHandler,
};
