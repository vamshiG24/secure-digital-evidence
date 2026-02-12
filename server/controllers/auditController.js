const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs
// @route   GET /api/logs
// @access  Private (Admin)
exports.getLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find({})
            .populate('user', 'name email role')
            .sort({ timestamp: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
