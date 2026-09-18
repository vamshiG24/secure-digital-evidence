const { getRedisClient } = require('../config/redis');

/**
 * Custom Redis-based Rate Limiter Middleware
 * @param {Object} options Configuration options
 * @param {number} options.windowMs Time window in milliseconds (default: 1 minute)
 * @param {number} options.max Maximum number of requests allowed in the window (default: 10)
 * @param {string} options.message Error message to return (default: 'Too many requests, please try again later.')
 */
const rateLimiter = ({ windowMs = 60 * 1000, max = 10, message = 'Too many requests, please try again later.' } = {}) => {
    return async (req, res, next) => {
        const client = getRedisClient();
        if (!client) {
            console.warn('Redis client not available for rate limiting. Bypassing rate limit.');
            return next();
        }

        // Try to identify IP address from headers or connection
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
        
        // Generate a unique cache key based on route path and client IP
        const routePath = req.baseUrl + req.path;
        const key = `ratelimit:${routePath}:${ip}`;

        try {
            const current = await client.incr(key);
            if (current === 1) {
                // Set expiry in seconds. Math.round ensures we have an integer.
                await client.expire(key, Math.round(windowMs / 1000));
            }

            // Expose standard rate limit headers
            res.set({
                'X-RateLimit-Limit': max,
                'X-RateLimit-Remaining': Math.max(0, max - current),
            });

            if (current > max) {
                return res.status(429).json({
                    message
                });
            }
            next();
        } catch (error) {
            console.error('Rate limiting middleware error:', error);
            // Fail-safe: allow request to proceed if Redis fails
            next();
        }
    };
};

module.exports = rateLimiter;
