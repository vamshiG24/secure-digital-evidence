const express = require('express');
const router = express.Router();
const {
    getCases,
    getCase,
    createCase,
    updateCase,
    deleteCase
} = require('../controllers/caseController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const auditLog = require('../middlewares/auditMiddleware');

router.route('/')
    .get(protect, getCases)
    .post(protect, authorize('admin'), auditLog('Create Case'), createCase);

router.route('/:id')
    .get(protect, getCase)
    .put(protect, authorize('admin', 'investigator'), auditLog('Update Case'), updateCase)
    .delete(protect, authorize('admin'), auditLog('Delete Case'), deleteCase);

module.exports = router;
