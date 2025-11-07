/**
 * Rate limiting middleware for API endpoints
 * Uses in-memory store for simplicity (use Redis in production)
 */

const NodeCache = require("node-cache");

// Create cache instances for different rate limits
const exportLimiter = new NodeCache({ stdTTL: 3600 }); // 1 hour TTL
const apiLimiter = new NodeCache({ stdTTL: 900 }); // 15 minutes TTL

/**
 * Rate limiter middleware factory
 * @param {Object} options - Configuration options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum number of requests per window
 * @param {string} options.message - Error message when limit exceeded
 * @param {NodeCache} options.store - Cache store to use
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 100, // 100 requests per window default
    message = "Too many requests, please try again later.",
    store = apiLimiter,
  } = options;

  return (req, res, next) => {
    // Get client identifier (IP address or user ID if authenticated)
    const identifier = req.user?.id || req.ip || req.connection.remoteAddress;
    const key = `rate_limit:${identifier}`;

    // Get current request count
    let requestData = store.get(key);

    if (!requestData) {
      // First request in window
      requestData = {
        count: 1,
        resetTime: Date.now() + windowMs,
      };
      store.set(key, requestData, windowMs / 1000);
    } else {
      // Increment count
      requestData.count += 1;
      
      // Check if limit exceeded
      if (requestData.count > max) {
        const remaining = Math.ceil((requestData.resetTime - Date.now()) / 1000);
        return res.status(429).json({
          error: message,
          retryAfter: remaining,
          limit: max,
          resetTime: new Date(requestData.resetTime).toISOString(),
        });
      }
      
      store.set(key, requestData, Math.ceil((requestData.resetTime - Date.now()) / 1000));
    }

    // Add rate limit headers
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - requestData.count));
    res.setHeader("X-RateLimit-Reset", new Date(requestData.resetTime).toISOString());

    next();
  };
}

/**
 * Export rate limiter - 10 requests per hour
 */
exports.exportRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 exports per hour
  message: "Export rate limit exceeded. You can only export 10 times per hour.",
  store: exportLimiter,
});

/**
 * General API rate limiter - 100 requests per 15 minutes
 */
exports.apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "API rate limit exceeded. Please try again later.",
  store: apiLimiter,
});

/**
 * Strict rate limiter for sensitive operations - 5 requests per minute
 */
exports.strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: "Too many requests. Please wait a moment before trying again.",
  store: apiLimiter,
});

// Export the factory for custom rate limiters
exports.createRateLimiter = createRateLimiter;

