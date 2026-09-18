const redis = require('redis');

let redisClient = null;

const connectRedis = async () => {
    try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        redisClient = redis.createClient({
            url: redisUrl,
            socket: {
                connectTimeout: 2000,
                reconnectStrategy: (retries) => {
                    if (retries > 2) {
                        return false; // Discontinue reconnection attempts if Redis server not present
                    }
                    return 1000;
                }
            }
        });

        redisClient.on('error', () => {
            // Suppress unhandled reconnect noise when Redis is not running locally
        });

        redisClient.on('connect', () => {
            console.log('Redis connected successfully');
        });

        await redisClient.connect();
    } catch (error) {
        console.log('Redis not detected, running with in-memory caching fallback.');
        redisClient = null;
    }
};

const getRedisClient = () => {
    if (redisClient && redisClient.isOpen) {
        return redisClient;
    }
    return null;
};

module.exports = { connectRedis, getRedisClient };
