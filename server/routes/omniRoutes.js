const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const User = require('../models/User');
const { protect } = require('../middlewares/authMiddleware');

// @desc    High-speed Global Omnibar search across cases, evidence, and users
// @route   GET /api/search/omni
// @access  Private
router.get('/omni', protect, async (req, res) => {
    try {
        const query = (req.query.q || '').trim();
        if (!query || query.length < 2) {
            return res.status(200).json({ cases: [], evidence: [], users: [] });
        }

        const regex = new RegExp(query, 'i');

        const [cases, evidence, users] = await Promise.all([
            Case.find({
                $or: [
                    { title: regex },
                    { description: regex },
                    { caseNumber: regex },
                    { tags: regex }
                ]
            })
            .select('title description caseNumber status priority createdAt')
            .limit(5),

            Evidence.find({
                $or: [
                    { fileName: regex },
                    { fileHash: regex },
                    { description: regex },
                    { tags: regex }
                ]
            })
            .select('fileName fileHash fileType fileSize caseId uploadedAt')
            .populate('caseId', 'title caseNumber')
            .limit(5),

            User.find({
                $or: [
                    { name: regex },
                    { email: regex },
                    { role: regex },
                    { badgeNumber: regex }
                ]
            })
            .select('name email role badgeNumber')
            .limit(4)
        ]);

        res.status(200).json({ cases, evidence, users });
    } catch (error) {
        console.error('Omni search error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
