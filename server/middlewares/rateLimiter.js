const { getRedisClient } = require('../config/redis');

// In-memory fallback so limits still apply when Redis is unavailable (single instance only)
const memoryBuckets = new Map();
const memoryHit = (key, windowMs) => {
    const now = Date.now();
    const bucket = memoryBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
        memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
        return 1;
    }
    bucket.count += 1;
    return bucket.count;
};
// Periodic sweep so the map does not grow unbounded
setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of memoryBuckets) {
        if (bucket.resetAt <= now) memoryBuckets.delete(key);
    }
}, 60 * 1000).unref();

/**
 * Rate limiter keyed on route + client IP. `req.ip` is derived from the
 * configured `trust proxy` setting, so it cannot be spoofed via headers.
 */
const rateLimiter = ({ windowMs = 60 * 1000, max = 10, message = 'Too many requests, please try again later.' } = {}) =>
    async (req, res, next) => {
        const key = `ratelimit:${req.baseUrl}${req.path}:${req.ip}`;
        let current;

        try {
            const client = getRedisClient();
            if (client) {
                current = await client.incr(key);
                if (current === 1) await client.expire(key, Math.ceil(windowMs / 1000));
            } else {
                current = memoryHit(key, windowMs);
            }
        } catch (error) {
            console.error('Rate limiter error, falling back to memory:', error.message);
            current = memoryHit(key, windowMs);
        }

        res.set({
            'X-RateLimit-Limit': max,
            'X-RateLimit-Remaining': Math.max(0, max - current)
        });

        if (current > max) {
            res.set('Retry-After', Math.ceil(windowMs / 1000));
            return res.status(429).json({ message });
        }
        next();
    };

module.exports = rateLimiter;
