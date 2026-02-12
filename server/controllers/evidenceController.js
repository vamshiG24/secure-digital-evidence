const Evidence = require('../models/Evidence');
const Case = require('../models/Case');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Helper to calculate file hash
const calculateHash = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', (err) => reject(err));
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
            // Clean up uploaded file if case not found
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Case not found' });
        }

        // Calculate Hash
        const fileHash = await calculateHash(req.file.path);

        // Create Evidence Record
        const evidence = await Evidence.create({
            caseId,
            uploader: req.user.id,
            fileName: req.file.originalname,
            filePath: req.file.path,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            hash: fileHash,
            description
        });

        // Notify Case Creator (Admin)
        try {
            // Re-fetch case to ensure we have the creator ID
            const freshCase = await Case.findById(caseId);

            if (freshCase && freshCase.createdBy) {
                const creatorId = freshCase.createdBy.toString(); // Case schema stores ID directly in createdBy

                // Don't notify if self-upload
                if (creatorId !== req.user.id) {
                    const Notification = require('../models/Notification');

                    // 1. Create Notification in DB (Always)
                    const notification = await Notification.create({
                        recipient: creatorId,
                        message: `New evidence uploaded for case: ${freshCase.title}`,
                        type: 'info', // Changed from 'alert' to 'info' to match enum
                        relatedLink: `/cases/${caseId}` // Changed from 'link' to 'relatedLink'
                    });

                    // 2. Emit Real-time via Socket (Best effort)
                    const io = req.app.get('socketio');
                    if (io) {
                        io.to(creatorId).emit('notification', notification);
                        console.log(`Notification sent to ${creatorId}`);
                    } else {
                        console.error('Socket.io instance not found in request');
                    }
                }
            }
        } catch (notifError) {
            console.error('Notification error:', notifError);
        }

        res.status(201).json(evidence);
    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path); // Cleanup on error
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get evidence for a case
// @route   GET /api/cases/:caseId/evidence
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

// @desc    Download evidence
// @route   GET /api/evidence/:id/download
// @access  Private
exports.downloadEvidence = async (req, res) => {
    try {
        const evidence = await Evidence.findById(req.params.id);
        if (!evidence) {
            return res.status(404).json({ message: 'Evidence not found' });
        }

        // Verify file exists
        if (!fs.existsSync(evidence.filePath)) {
            return res.status(404).json({ message: 'File not found on server' });
        }

        res.download(evidence.filePath, evidence.fileName);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
