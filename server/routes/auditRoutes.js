const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/auditController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/', protect, authorize('admin'), getLogs);

module.exports = router;
