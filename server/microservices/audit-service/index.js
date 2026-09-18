require('dotenv').config();
const connectDB = require('../../config/db');
const { connectRedis } = require('../../config/redis');
const createApp = require('../../config/createApp');

connectDB();
connectRedis();

const { server } = createApp({
    name: 'audit-service',
    withSockets: false,
    routes: [
        ['/api/logs', require('../../routes/auditRoutes')],
    ]
});

const PORT = process.env.PORT || 5005;
server.listen(PORT, () => console.log('audit-service running on port ' + PORT));
