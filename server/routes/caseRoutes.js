const express = require('express');
const router = express.Router();
const {
    getCases,
    getCase,
    createCase,
    updateCase,
    deleteCase,
    getCaseMessages,
    sendCaseMessage,
    getCaseTimeline,
    exportCaseDossier,
    getCaseAnalytics,
    addCaseNote
} = require('../controllers/caseController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const auditLog = require('../middlewares/auditMiddleware');

// Aggregate forensic stats (must precede /:id)
router.get('/stats/analytics', protect, getCaseAnalytics);

router.route('/')
    .get(protect, getCases)
    .post(protect, authorize('admin', 'investigator'), auditLog('Create Case'), createCase);

router.route('/:id')
    .get(protect, getCase)
    .put(protect, authorize('admin', 'investigator'), auditLog('Update Case'), updateCase)
    .delete(protect, authorize('admin'), auditLog('Delete Case'), deleteCase);

router.route('/:id/messages')
    .get(protect, getCaseMessages)
    .post(protect, sendCaseMessage);

// Forensic Timeline & Dossier Export routes
router.get('/:id/timeline', protect, auditLog('View Case Forensic Timeline'), getCaseTimeline);
router.get('/:id/export', protect, auditLog('Export Case Forensic Dossier'), exportCaseDossier);
router.post('/:id/notes', protect, authorize('admin', 'investigator'), auditLog('Add Investigator Note'), addCaseNote);

module.exports = router;
