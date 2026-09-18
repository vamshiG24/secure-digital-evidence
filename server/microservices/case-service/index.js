require('dotenv').config();
const connectDB = require('../../config/db');
const { connectRedis } = require('../../config/redis');
const createApp = require('../../config/createApp');

connectDB();
connectRedis();

const { server } = createApp({
    name: 'case-service',
    withSockets: true,
    routes: [
        ['/api/cases', require('../../routes/caseRoutes')],
        ['/api/rag', require('../../routes/ragRoutes')],
        ['/api/search', require('../../routes/omniRoutes')],
    ]
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => console.log('case-service running on port ' + PORT));
