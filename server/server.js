require('dotenv').config();
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const createApp = require('./config/createApp');

const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
}

connectDB();
connectRedis();

const { server } = createApp({
    name: 'api-gateway',
    withSockets: true,
    routes: [
        ['/api/users', require('./routes/userRoutes')],
        ['/api/cases', require('./routes/caseRoutes')],
        ['/api/evidence', require('./routes/evidenceRoutes')],
        ['/api/notifications', require('./routes/notificationRoutes')],
        ['/api/logs', require('./routes/auditRoutes')],
        ['/api/rag', require('./routes/ragRoutes')],
        ['/api/search', require('./routes/omniRoutes')]
    ]
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`API gateway running on port ${PORT}`));
