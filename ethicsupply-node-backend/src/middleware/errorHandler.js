/**
 * Error handling middleware
 * Handles various types of errors and sends appropriate responses
 */

// Handle 404 errors for routes that don't exist
exports.notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// Handle all other errors
exports.errorHandler = (err, req, res, next) => {
  // Set status code (use err.status or default to 500)
  const statusCode = err.status || 500;

  // Prepare error response
  const errorResponse = {
    error: {
      message: err.message || "Internal Server Error",
      status: statusCode,
    },
  };

  // Add stack trace in development mode
  if (process.env.NODE_ENV === "development") {
    errorResponse.error.stack = err.stack;
  }

  // Log error
  console.error(`[ERROR] ${statusCode} - ${err.message}`);

  // Send response
  res.status(statusCode).json(errorResponse);
};
