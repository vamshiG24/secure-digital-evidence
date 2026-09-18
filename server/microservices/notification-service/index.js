require('dotenv').config();
const connectDB = require('../../config/db');
const { connectRedis } = require('../../config/redis');
const createApp = require('../../config/createApp');

connectDB();
connectRedis();

const { server } = createApp({
    name: 'notification-service',
    withSockets: false,
    routes: [
        ['/api/notifications', require('../../routes/notificationRoutes')],
    ]
});

const PORT = process.env.PORT || 5004;
server.listen(PORT, () => console.log('notification-service running on port ' + PORT));
