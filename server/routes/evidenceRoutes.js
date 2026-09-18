const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
    uploadEvidence, 
    getAllEvidence,
    getCaseEvidence, 
    downloadEvidence,
    verifyEvidence,
    transferCustody,
    verifyCustodyChain,
    batchVerify,
    simulateTampering
} = require('../controllers/evidenceController');
const { protect } = require('../middlewares/authMiddleware');
const auditLog = require('../middlewares/auditMiddleware');
const rateLimiter = require('../middlewares/rateLimiter');

// Rate limiter for evidence uploads
const uploadLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: 'Too many file upload requests. Please try again after a minute.'
});

// Memory storage for SHA-256 and MD5/SHA-1 buffer computation
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1024 * 1024 * 50 } // 50MB limit
});

router.route('/')
    .get(protect, getAllEvidence)
    .post(protect, uploadLimiter, upload.single('file'), auditLog('Upload Evidence'), uploadEvidence);

router.post('/batch-verify', protect, auditLog('Batch Vault Integrity Audit'), batchVerify);

router.get('/:caseId/list', protect, getCaseEvidence);
router.get('/:id/download', protect, auditLog('Download Evidence'), downloadEvidence);
router.get('/:id/verify', protect, auditLog('Verify Evidence Integrity'), verifyEvidence);

// Chain of Custody routes
router.post('/:id/custody/transfer', protect, auditLog('Transfer Evidence Custody'), transferCustody);
router.get('/:id/custody/verify', protect, auditLog('Verify Chain of Custody'), verifyCustodyChain);

router.put('/:id/simulate-tamper', protect, auditLog('Simulate Evidence Tampering'), simulateTampering);

module.exports = router;
