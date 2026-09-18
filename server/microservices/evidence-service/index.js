require('dotenv').config();
const connectDB = require('../../config/db');
const { connectRedis } = require('../../config/redis');
const createApp = require('../../config/createApp');

connectDB();
connectRedis();

const { server } = createApp({
    name: 'evidence-service',
    withSockets: false,
    routes: [
        ['/api/evidence', require('../../routes/evidenceRoutes')],
    ]
});

const PORT = process.env.PORT || 5003;
server.listen(PORT, () => console.log('evidence-service running on port ' + PORT));
