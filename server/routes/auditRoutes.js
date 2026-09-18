const express = require('express');
const router = express.Router();
const { getLogs, getAuditStats, exportLogs } = require('../controllers/auditController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/', protect, authorize('admin', 'investigator'), getLogs);
router.get('/stats', protect, authorize('admin', 'investigator'), getAuditStats);
router.get('/export', protect, authorize('admin', 'investigator'), exportLogs);

module.exports = router;
