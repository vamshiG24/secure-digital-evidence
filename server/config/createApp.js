const express = require('express');
const http = require('http');
const os = require('os');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const isProd = process.env.NODE_ENV === 'production';

const buildAllowedOrigins = () => {
    const origins = new Set(
        isProd ? [] : ['http://localhost', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175']
    );
    for (const raw of (process.env.FRONTEND_URL || '').split(',')) {
        const url = raw.trim();
        if (!url) continue;
        origins.add(url);
        if (url.includes('//www.')) origins.add(url.replace('//www.', '//'));
    }
    return Array.from(origins);
};

/**
 * Socket.IO handshake auth: reads the httpOnly session cookie (or a Bearer
 * token for non-browser clients) and applies the same checks as `protect`.
 */
const authenticateSocket = async (socket, next) => {
    try {
        const { verifySessionToken } = require('../middlewares/authMiddleware');
        const rawCookie = socket.handshake.headers.cookie || '';
        const cookieToken = rawCookie.split(';').map(c => c.trim()).find(c => c.startsWith('token='))?.slice(6);
        const bearer = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');
        const user = await verifySessionToken(cookieToken || bearer);
        if (!user) return next(new Error('unauthorized'));
        socket.user = user;
        next();
    } catch {
        next(new Error('unauthorized'));
    }
};

/**
 * Shared Express bootstrap used by the monolith and every microservice.
 *
 * @param {object} options
 * @param {string} options.name              Service name for logs/headers
 * @param {Array<[string, import('express').Router]>} options.routes  [mountPath, router] pairs
 * @param {boolean} [options.withSockets]    Attach Socket.IO to the HTTP server
 */
const createApp = ({ name, routes, withSockets = false }) => {
    const app = express();
    const server = http.createServer(app);
    const allowedOrigins = buildAllowedOrigins();

    // Only trust the first proxy hop (nginx) so X-Forwarded-For cannot be spoofed by clients
    app.set('trust proxy', 1);
    app.disable('x-powered-by');

    app.use(helmet());
    app.use(express.json({ limit: '1mb' }));
    app.use(cookieParser());
    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error(`Origin ${origin} not allowed by CORS`));
        },
        credentials: true
    }));
    app.use(morgan(isProd ? 'combined' : 'dev'));

    const serverId = os.hostname();
    app.use((req, res, next) => {
        res.setHeader('X-Served-By', `${name}@${serverId}`);
        next();
    });

    app.get('/health', (req, res) => {
        const mongoose = require('mongoose');
        res.json({
            service: name,
            status: 'ok',
            uptime: Math.round(process.uptime()),
            db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
        });
    });

    for (const [mountPath, router] of routes) {
        app.use(mountPath, router);
    }

    let io = null;
    if (withSockets) {
        io = new Server(server, {
            cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
            maxHttpBufferSize: 1e6
        });

        // Sockets authenticate with the same session cookie as HTTP requests.
        io.use(authenticateSocket);

        io.on('connection', (socket) => {
            const userId = String(socket.user._id);
            // A user may only ever listen to their own notification room
            socket.join(userId);
            socket.on('join_room', () => socket.join(userId));

            socket.on('join_case_room', async (caseId) => {
                if (typeof caseId !== 'string' || !/^[a-f0-9]{24}$/i.test(caseId)) return;
                const Case = require('../models/Case');
                const { canAccessCase } = require('../utils/caseAccess');
                const caseItem = await Case.findById(caseId).select('createdBy assignedTo').lean();
                if (caseItem && canAccessCase(socket.user, caseItem)) socket.join(caseId);
            });
        });
        app.set('socketio', io);
    }

    app.use((req, res) => {
        res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
    });

    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        if (err.message?.includes('not allowed by CORS')) {
            return res.status(403).json({ message: err.message });
        }
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ message: 'File exceeds the 50MB upload limit' });
        }
        console.error(`[${name}]`, err.stack || err);
        res.status(err.status || 500).json({
            message: isProd ? 'Internal server error' : err.message
        });
    });

    return { app, server, io };
};

module.exports = createApp;
