const crypto = require('crypto');
const https = require('https');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;
const Evidence = require('../models/Evidence');
const Case = require('../models/Case');
const Notification = require('../models/Notification');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a buffer to Cloudinary via a stream.
 * Returns the Cloudinary upload result.
 */
const uploadToCloudinary = (buffer, options) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

// @desc    Upload evidence file
// @route   POST /api/evidence
// @access  Private (Investigator/Admin)
exports.uploadEvidence = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        const { caseId, description } = req.body;

        const caseItem = await Case.findById(caseId);
        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }

        // 1. Compute SHA-256 hash from the in-memory file buffer BEFORE uploading
        const fileHash = crypto
            .createHash('sha256')
            .update(req.file.buffer)
            .digest('hex');

        // 2. Upload buffer to Cloudinary via stream
        // Using 'raw' instead of 'auto' ensures Cloudinary does NOT strip metadata or process the file
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, {
            folder: 'secure-digital-evidence',
            resource_type: 'raw',
            public_id: `${Date.now()}-${req.file.originalname}`
        });

        // 3. Create Evidence record with hash
        const evidence = await Evidence.create({
            caseId,
            uploader: req.user.id,
            fileName: req.file.originalname,
            filePath: cloudinaryResult.secure_url,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            description,
            fileHash // SHA-256 integrity hash
        });

        // 4. Notify Case Creator (Admin) via Socket.io
        try {
            const freshCase = await Case.findById(caseId);
            if (freshCase && freshCase.createdBy) {
                const creatorId = freshCase.createdBy.toString();

                if (creatorId !== req.user.id) {
                    const notification = await Notification.create({
                        recipient: creatorId,
                        message: `New evidence uploaded for case: ${freshCase.title}`,
                        type: 'info',
                        relatedLink: `/cases/${caseId}`
                    });

                    const io = req.app.get('socketio');
                    if (io) {
                        io.to(creatorId).emit('notification', notification);
                    }
                }
            }
        } catch (notifError) {
            console.error('Notification error:', notifError);
        }

        res.status(201).json(evidence);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get evidence for a case
// @route   GET /api/evidence/:caseId/list
// @access  Private
exports.getCaseEvidence = async (req, res) => {
    try {
        const evidenceList = await Evidence.find({ caseId: req.params.caseId })
            .populate('uploader', 'name email');
        res.status(200).json(evidenceList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Download evidence (redirect to Cloudinary URL)
// @route   GET /api/evidence/:id/download
// @access  Private
exports.downloadEvidence = async (req, res) => {
    try {
        const evidence = await Evidence.findById(req.params.id);
        if (!evidence) {
            return res.status(404).json({ message: 'Evidence not found' });
        }
        res.redirect(evidence.filePath);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify evidence integrity by recalculating hash from Cloudinary
// @route   GET /api/evidence/:id/verify
// @access  Private
exports.verifyEvidence = async (req, res) => {
    try {
        const evidence = await Evidence.findById(req.params.id);
        if (!evidence) {
            return res.status(404).json({ message: 'Evidence not found' });
        }

        // Download the file from Cloudinary
        https.get(evidence.filePath, (response) => {
            if (response.statusCode !== 200) {
                return res.status(500).json({ message: 'Failed to download file for verification' });
            }

            const hash = crypto.createHash('sha256');

            response.on('data', (chunk) => {
                hash.update(chunk);
            });

            response.on('end', () => {
                const currentHash = hash.digest('hex');
                const isIntact = currentHash === evidence.fileHash;

                res.status(200).json({
                    verified: isIntact,
                    originalHash: evidence.fileHash,
                    currentHash: currentHash,
                    message: isIntact 
                        ? 'File integrity verified. No tampering detected.' 
                        : 'WARNING: File integrity check failed. The file may have been tampered with or corrupted!'
                });
            });
        }).on('error', (err) => {
            res.status(500).json({ message: `Error downloading file: ${err.message}` });
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Simulate tampering for demonstration purposes
// @route   PUT /api/evidence/:id/simulate-tamper
// @access  Private
exports.simulateTampering = async (req, res) => {
    try {
        const evidence = await Evidence.findById(req.params.id);
        if (!evidence) {
            return res.status(404).json({ message: 'Evidence not found' });
        }

        // Corrupt the hash slightly to simulate tampering
        let alteredHash = evidence.fileHash.split('');
        alteredHash[0] = alteredHash[0] === 'a' ? 'b' : 'a'; // simple change
        evidence.fileHash = alteredHash.join('');
        
        await evidence.save();

        res.status(200).json({ 
            message: 'Tampering simulated successfully! The stored hash has been modified.',
            evidence
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
