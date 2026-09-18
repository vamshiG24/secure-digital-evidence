require('dotenv').config();
const connectDB = require('../../config/db');
const { connectRedis } = require('../../config/redis');
const createApp = require('../../config/createApp');

connectDB();
connectRedis();

const { server } = createApp({
    name: 'user-service',
    withSockets: false,
    routes: [
        ['/api/users', require('../../routes/userRoutes')],
    ]
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log('user-service running on port ' + PORT));
