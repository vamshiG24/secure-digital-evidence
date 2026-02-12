const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadEvidence, getCaseEvidence, downloadEvidence } = require('../controllers/evidenceController');
const { protect } = require('../middlewares/authMiddleware');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Correct path relative to server root
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// File Filter (Optional: restrict types)
const fileFilter = (req, file, cb) => {
    // Accept all for now, or restrict to detailed types
    cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 50 } // 50MB limit
});

const auditLog = require('../middlewares/auditMiddleware');

router.post('/', protect, upload.single('file'), auditLog('Upload Evidence'), uploadEvidence);
router.get('/:caseId/list', protect, getCaseEvidence);
router.get('/:id/download', protect, auditLog('Download Evidence'), downloadEvidence);

module.exports = router;
