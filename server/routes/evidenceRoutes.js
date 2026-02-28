const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { uploadEvidence, getCaseEvidence, downloadEvidence } = require('../controllers/evidenceController');
const { protect } = require('../middlewares/authMiddleware');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'secure-digital-evidence',
        resource_type: 'auto', // Allows uploading all file types (images, pdfs, etc.)
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 50 } // 50MB limit
});

const auditLog = require('../middlewares/auditMiddleware');

router.post('/', protect, upload.single('file'), auditLog('Upload Evidence'), uploadEvidence);
router.get('/:caseId/list', protect, getCaseEvidence);
router.get('/:id/download', protect, auditLog('Download Evidence'), downloadEvidence);

module.exports = router;
