/**
 * Request logging middleware
 * Logs information about incoming requests
 */

const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);

  // Add response listener to log response time
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusText = statusCode >= 400 ? "⚠️" : "✓";

    console.log(
      `[${new Date().toISOString()}] ${statusText} ${req.method} ${
        req.originalUrl
      } ${statusCode} (${duration}ms)`
    );
  });

  next();
};

module.exports = requestLogger;
