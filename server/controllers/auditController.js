const AuditLog = require('../models/AuditLog');
const escapeRegex = require('../utils/escapeRegex');

// @desc    Get all audit logs with optional filtering & pagination
// @route   GET /api/logs
// @access  Private (Admin)
exports.getLogs = async (req, res) => {
    try {
        const { action, search, limit = 100 } = req.query;
        let query = {};

        if (action && action !== 'All') {
            query.action = action;
        }

        if (search) {
            const safe = escapeRegex(search);
            query.$or = [
                { action: { $regex: safe, $options: 'i' } },
                { details: { $regex: safe, $options: 'i' } },
                { ipAddress: { $regex: safe, $options: 'i' } }
            ];
        }

        const logs = await AuditLog.find(query)
            .populate('user', 'name email role')
            .sort({ timestamp: -1 })
            .limit(Math.min(parseInt(limit, 10) || 100, 1000));

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Audit & Compliance Security Telemetry Stats
// @route   GET /api/logs/stats
// @access  Private (Admin)
exports.getAuditStats = async (req, res) => {
    try {
        const totalLogs = await AuditLog.countDocuments();
        const tamperAlerts = await AuditLog.countDocuments({
            $or: [
                { action: { $regex: 'Tamper', $options: 'i' } },
                { details: { $regex: 'tamper|failed|corrupt', $options: 'i' } }
            ]
        });

        // Unique remote IP addresses
        const uniqueIps = await AuditLog.distinct('ipAddress');

        // Recent 24h events
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recent24hCount = await AuditLog.countDocuments({ timestamp: { $gte: oneDayAgo } });

        res.status(200).json({
            totalLogs,
            tamperAlerts,
            uniqueIpsCount: uniqueIps.length,
            recent24hCount,
            systemHealth: tamperAlerts === 0 ? 'Optimal (Zero Tampering)' : 'Attention Required'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Export Audit Trail to CSV or JSON
// @route   GET /api/logs/export
// @access  Private (Admin)
exports.exportLogs = async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        const logs = await AuditLog.find({})
            .populate('user', 'name email role')
            .sort({ timestamp: -1 });

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="audit_trail_export.json"');
            return res.status(200).json(logs);
        }

        // CSV generation
        const headers = ['Timestamp', 'Action', 'User Name', 'User Email', 'User Role', 'IP Address', 'Details'];
        const csvRows = [headers.join(',')];

        logs.forEach(log => {
            const row = [
                `"${new Date(log.timestamp).toISOString()}"`,
                `"${(log.action || '').replace(/"/g, '""')}"`,
                `"${(log.user?.name || 'System').replace(/"/g, '""')}"`,
                `"${(log.user?.email || 'N/A').replace(/"/g, '""')}"`,
                `"${(log.user?.role || 'System').replace(/"/g, '""')}"`,
                `"${(log.ipAddress || '—').replace(/"/g, '""')}"`,
                `"${(log.details || '').replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(','));
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audit_trail_export.csv"');
        res.status(200).send(csvRows.join('\n'));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
