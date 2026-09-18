require('dotenv').config();
const express = require('express');
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

const allowedOrigins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176"
];

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

// Routes
app.use('/api/logs', require('../../routes/auditRoutes'));

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Audit Service Error', error: err.message });
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
    console.log(`Audit Service running on port ${PORT}`);
});
