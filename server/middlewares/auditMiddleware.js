const AuditLog = require('../models/AuditLog');

const auditLog = (action) => async (req, res, next) => {
    // Capture the original send to intercept the response
    const originalSend = res.send;

    res.send = function (data) {
        res.send = originalSend; // restore original send
        res.send(data); // send the data

        // Log after response is sent
        const logData = {
            user: req.user ? req.user._id : null,
            action: action,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            details: `${req.method} ${req.originalUrl}`
        };

        AuditLog.create(logData).catch(err => console.error('Audit Log Error:', err));
    };

    next();
};

module.exports = auditLog;
