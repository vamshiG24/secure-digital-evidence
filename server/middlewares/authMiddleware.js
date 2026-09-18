const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getRedisClient } = require('../config/redis');

const extractToken = (req) => {
    if (req.cookies?.token) return req.cookies.token;
    const header = req.headers.authorization || '';
    return header.startsWith('Bearer ') ? header.slice(7) : null;
};

/**
 * Validate a session token and return the active user, or null.
 * Shared by the HTTP `protect` middleware and the Socket.IO handshake.
 */
const verifySessionToken = async (token) => {
    if (!token) return null;

    const client = getRedisClient();
    if (client) {
        const digest = crypto.createHash('sha256').update(token).digest('hex');
        if (await client.get(`blocklist:${digest}`)) return null;
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return null;
    }

    const user = await User.findById(decoded.id);
    if (!user || user.status !== 'active') return null;

    // Tokens issued before the last password change are no longer valid
    if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime() - 1000) {
        return null;
    }
    return user;
};

exports.verifySessionToken = verifySessionToken;

exports.protect = async (req, res, next) => {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
    try {
        const user = await verifySessionToken(token);
        if (!user) {
            return res.status(401).json({ message: 'Session is invalid or expired, please sign in again' });
        }
        req.user = user;
        return next();
    } catch {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

exports.authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({
            message: `Role "${req.user.role}" is not authorized to access this resource`
        });
    }
    next();
};
