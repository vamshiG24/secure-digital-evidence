const express = require('express');
const router = express.Router();
const { getLogs, getAuditStats, exportLogs } = require('../controllers/auditController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/', protect, authorize('admin'), getLogs);
router.get('/stats', protect, authorize('admin'), getAuditStats);
router.get('/export', protect, authorize('admin'), exportLogs);

module.exports = router;
