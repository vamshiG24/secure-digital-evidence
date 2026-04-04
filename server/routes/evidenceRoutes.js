const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
    uploadEvidence, 
    getCaseEvidence, 
    downloadEvidence,
    verifyEvidence,
    simulateTampering
} = require('../controllers/evidenceController');
const { protect } = require('../middlewares/authMiddleware');
const auditLog = require('../middlewares/auditMiddleware');

// Use memory storage so buffer is available for SHA-256 hashing before Cloudinary upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1024 * 1024 * 50 } // 50MB limit
});

router.post('/', protect, upload.single('file'), auditLog('Upload Evidence'), uploadEvidence);
router.get('/:caseId/list', protect, getCaseEvidence);
router.get('/:id/download', protect, auditLog('Download Evidence'), downloadEvidence);
router.get('/:id/verify', protect, auditLog('Verify Evidence Integrity'), verifyEvidence);
router.put('/:id/simulate-tamper', protect, auditLog('Simulate Evidence Tampering'), simulateTampering);

module.exports = router;
