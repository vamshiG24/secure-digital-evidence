const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    uploadEvidence,
    getAllEvidence,
    getCaseEvidence,
    downloadEvidence,
    previewEvidence,
    verifyEvidence,
    transferCustody,
    verifyCustodyChain,
    batchVerify,
    simulateTampering
} = require('../controllers/evidenceController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const auditLog = require('../middlewares/auditMiddleware');
const rateLimiter = require('../middlewares/rateLimiter');

const uploadLimiter = rateLimiter({
    windowMs: 60 * 1000,
    max: 20,
    message: 'Too many file upload requests. Please try again after a minute.'
});

// Memory storage so hashes are computed on the exact bytes that get stored
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1024 * 1024 * 50, files: 1 }
});

const canHandleEvidence = authorize('admin', 'investigator');

router.route('/')
    .get(protect, getAllEvidence)
    .post(protect, canHandleEvidence, uploadLimiter, upload.single('file'), auditLog('Upload Evidence'), uploadEvidence);

router.post('/batch-verify', protect, authorize('admin', 'analyst'), auditLog('Batch Vault Integrity Audit'), batchVerify);

router.get('/:caseId/list', protect, getCaseEvidence);
router.get('/:id/download', protect, auditLog('Download Evidence'), downloadEvidence);
router.get('/:id/preview', protect, previewEvidence);
router.get('/:id/verify', protect, auditLog('Verify Evidence Integrity'), verifyEvidence);

router.post('/:id/custody/transfer', protect, canHandleEvidence, auditLog('Transfer Evidence Custody'), transferCustody);
router.get('/:id/custody/verify', protect, auditLog('Verify Chain of Custody'), verifyCustodyChain);

// Demo helper — refuses to run in production (see controller)
router.put('/:id/simulate-tamper', protect, authorize('admin'), auditLog('Simulate Evidence Tampering'), simulateTampering);

module.exports = router;
