require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('../../config/db');
const { connectRedis } = require('../../config/redis');

// Connect to Database
connectDB();
connectRedis();

const app = express();
app.set('trust proxy', true);

const server = http.createServer(app);

const allowedOrigins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176"
];

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    },
});

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('Blocked by CORS'), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));

// Internal Communication Routes
app.post('/api/cases/internal/emit-notification', (req, res) => {
    const { recipient, notification } = req.body;
    if (io) {
        io.to(recipient).emit('notification', notification);
        return res.status(200).json({ success: true });
    }
    res.status(500).json({ message: 'Socket.io not ready' });
});

// Routes
app.use('/api/cases', require('../../routes/caseRoutes'));
app.use('/api/rag', require('../../routes/ragRoutes'));
app.use('/api/search', require('../../routes/omniRoutes'));

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('A user connected to Case Service:', socket.id);

    socket.on('join_room', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room ${userId} in Case Service`);
    });

    socket.on('join_case_room', (caseId) => {
        socket.join(caseId);
        console.log(`User socket ${socket.id} joined case room ${caseId} in Case Service`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected from Case Service:', socket.id);
    });
});

// Make io accessible globally
app.set('socketio', io);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Case Service Error', error: err.message });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
    console.log(`Case Service running on port ${PORT}`);
});
