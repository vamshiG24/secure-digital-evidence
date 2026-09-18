const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const User = require('../models/User');
const Message = require('../models/Message');
const { getRedisClient } = require('../config/redis');

// Helper to clear all user-specific cases list caches
const clearCasesListCache = async (client) => {
    if (!client) return;
    try {
        const keys = [];
        for await (const key of client.scanIterator({ MATCH: 'cases:list:*' })) {
            keys.push(key);
        }
        if (keys.length > 0) {
            await client.del(keys);
            console.log(`Cleared ${keys.length} cases list caches`);
        }
    } catch (err) {
        console.error('Failed to clear cases list cache:', err);
    }
};

// @desc    Get all cases (Admin & Analyst see all, Investigator sees assigned or created)
// @route   GET /api/cases
// @access  Private
exports.getCases = async (req, res) => {
    try {
        const client = getRedisClient();
        const cacheKey = `cases:list:${req.user.id}`;

        if (client) {
            try {
                const cachedData = await client.get(cacheKey);
                if (cachedData) {
                    return res.status(200).json(JSON.parse(cachedData));
                }
            } catch (err) {
                console.error(`Redis get cache error for cases list: ${req.user.id}`, err);
            }
        }

        let query = {};
        if (req.user.role === 'admin' || req.user.role === 'analyst') {
            query = {}; // Chief / Admin / Analyst can see all cases
        } else {
            query = {
                $or: [
                    { assignedTo: req.user.id },
                    { createdBy: req.user.id }
                ]
            };
        }

        const cases = await Case.find(query)
            .populate('assignedTo', 'name email role badgeNumber')
            .populate('createdBy', 'name email role')
            .sort({ createdAt: -1 });

        if (client) {
            try {
                await client.set(cacheKey, JSON.stringify(cases), { EX: 120 });
            } catch (err) {
                console.error(`Redis set cache error:`, err);
            }
        }

        res.status(200).json(cases);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single case
// @route   GET /api/cases/:id
// @access  Private
exports.getCase = async (req, res) => {
    try {
        const caseId = req.params.id;
        const client = getRedisClient();
        const cacheKey = `case:detail:${caseId}`;

        if (client) {
            try {
                const cachedData = await client.get(cacheKey);
                if (cachedData) {
                    return res.status(200).json(JSON.parse(cachedData));
                }
            } catch (err) {
                console.error(`Redis get cache error for case: ${caseId}`, err);
            }
        }

        const caseItem = await Case.findById(caseId)
            .populate('assignedTo', 'name email role badgeNumber')
            .populate('createdBy', 'name email role');

        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }

        if (client) {
            try {
                await client.set(cacheKey, JSON.stringify(caseItem), { EX: 180 });
            } catch (err) {
                console.error(`Redis set cache error: ${caseId}`, err);
            }
        }

        res.status(200).json(caseItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new case
// @route   POST /api/cases
// @access  Private (Admin, Investigator)
exports.createCase = async (req, res) => {
    try {
        const { title, description, priority, assignedTo, tags, incidentDate, courtReference } = req.body;

        const year = new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000);
        const caseNumber = `CASE-${year}-${rand}`;

        const caseItem = await Case.create({
            caseNumber,
            title,
            description,
            priority: priority || 'Medium',
            assignedTo: assignedTo || undefined,
            createdBy: req.user.id,
            tags: tags && tags.length ? tags : ['Digital Forensics'],
            incidentDate: incidentDate || new Date(),
            courtReference: courtReference || ''
        });

        // Notify Investigator if assigned
        if (assignedTo) {
            try {
                const Notification = require('../models/Notification');
                const io = req.app.get('socketio');

                const notification = await Notification.create({
                    recipient: assignedTo,
                    message: `You have been assigned to case [${caseNumber}]: ${title}`,
                    type: 'info',
                    relatedLink: `/cases/${caseItem._id}`
                });

                if (io) {
                    io.to(assignedTo).emit('notification', notification);
                }
            } catch (notifyError) {
                console.error("Notification creation error:", notifyError);
            }
        }

        const client = getRedisClient();
        await clearCasesListCache(client);

        const populated = await Case.findById(caseItem._id)
            .populate('assignedTo', 'name email role badgeNumber')
            .populate('createdBy', 'name email role');

        res.status(201).json(populated);
    } catch (error) {
        console.error("Error in createCase:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update case
// @route   PUT /api/cases/:id
// @access  Private (Admin, Investigator)
exports.updateCase = async (req, res) => {
    try {
        let caseItem = await Case.findById(req.params.id);
        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }

        const updateData = { ...req.body };
        if (!updateData.assignedTo) {
            delete updateData.assignedTo;
        }

        caseItem = await Case.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        })
            .populate('assignedTo', 'name email role badgeNumber')
            .populate('createdBy', 'name email role');

        const client = getRedisClient();
        if (client) {
            try {
                await clearCasesListCache(client);
                await client.del(`case:detail:${req.params.id}`);
            } catch (err) {
                console.error(`Failed to invalidate cache: ${req.params.id}`, err);
            }
        }

        res.status(200).json(caseItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete case
// @route   DELETE /api/cases/:id
// @access  Private (Admin)
exports.deleteCase = async (req, res) => {
    try {
        const caseItem = await Case.findById(req.params.id);
        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }

        await Case.deleteOne({ _id: req.params.id });

        const client = getRedisClient();
        if (client) {
            try {
                await clearCasesListCache(client);
                await client.del(`case:detail:${req.params.id}`);
                await client.del(`case:evidence:${req.params.id}`);
            } catch (err) {
                console.error(`Failed to invalidate cache for case: ${req.params.id}`, err);
            }
        }

        res.status(200).json({ message: 'Case removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get messages for a case
// @route   GET /api/cases/:id/messages
// @access  Private
exports.getCaseMessages = async (req, res) => {
    try {
        const messages = await Message.find({ caseId: req.params.id })
            .populate('sender', 'name email role')
            .sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send a message in a case
// @route   POST /api/cases/:id/messages
// @access  Private
exports.sendCaseMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const caseId = req.params.id;

        const caseItem = await Case.findById(caseId);
        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }

        const newMessage = await Message.create({
            caseId,
            sender: req.user.id,
            message
        });

        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'name email role');

        const io = req.app.get('socketio');
        if (io) {
            io.to(caseId).emit('new_message', populatedMessage);
        }

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add official investigator note to case
// @route   POST /api/cases/:id/notes
// @access  Private (Admin, Investigator)
exports.addCaseNote = async (req, res) => {
    try {
        const { note, classification = 'Routine' } = req.body;
        const caseItem = await Case.findById(req.params.id);
        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }

        const newNote = {
            author: req.user.id,
            authorName: req.user.name || 'Investigator',
            note,
            classification,
            createdAt: new Date()
        };

        caseItem.investigatorNotes.push(newNote);
        await caseItem.save();

        res.status(201).json({ message: 'Note added successfully', notes: caseItem.investigatorNotes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Compile Chronological Forensic Timeline for Case
// @route   GET /api/cases/:id/timeline
// @access  Private
exports.getCaseTimeline = async (req, res) => {
    try {
        const caseItem = await Case.findById(req.params.id)
            .populate('createdBy', 'name role')
            .populate('assignedTo', 'name role');

        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }

        const evidence = await Evidence.find({ caseId: req.params.id })
            .populate('uploader', 'name role');

        const events = [];

        // 1. Case Creation event
        events.push({
            id: `case-create-${caseItem._id}`,
            date: caseItem.createdAt,
            type: 'CASE_CREATION',
            title: `Case Initiated (${caseItem.caseNumber || 'CASE-INITIAL'})`,
            description: `Case "${caseItem.title}" officially registered by ${caseItem.createdBy?.name || 'Administrator'}. Priority set to ${caseItem.priority}.`,
            actor: caseItem.createdBy?.name || 'System',
            badgeColor: '#1d4ed8'
        });

        // 2. Evidence Upload & Chain of Custody events
        evidence.forEach(ev => {
            events.push({
                id: `ev-upload-${ev._id}`,
                date: ev.uploadedAt,
                type: 'EVIDENCE_INGESTED',
                title: `Evidence Seized: ${ev.fileName}`,
                description: `File ingested with cryptographic seal SHA-256 [${ev.fileHash.slice(0, 16)}...]. Size: ${(ev.fileSize / 1024).toFixed(1)} KB.`,
                actor: ev.uploader?.name || 'Investigator',
                evidenceId: ev._id,
                badgeColor: '#16a34a'
            });

            // Custody block transfers
            if (ev.chainOfCustody && ev.chainOfCustody.length > 1) {
                ev.chainOfCustody.slice(1).forEach(block => {
                    events.push({
                        id: `block-${block._id || block.hash}`,
                        date: block.timestamp,
                        type: block.action,
                        title: `Custody Transfer: ${ev.fileName}`,
                        description: `Transferred to ${block.custodian?.name || 'Custodian'} (${block.custodian?.role || 'Specialist'}). Notes: ${block.notes}`,
                        actor: block.custodian?.name || 'Custodian',
                        evidenceId: ev._id,
                        badgeColor: '#ca8a04'
                    });
                });
            }
        });

        // 3. Investigator Notes events
        if (caseItem.investigatorNotes && caseItem.investigatorNotes.length > 0) {
            caseItem.investigatorNotes.forEach(n => {
                events.push({
                    id: `note-${n._id}`,
                    date: n.createdAt,
                    type: 'INVESTIGATOR_NOTE',
                    title: `Investigator Note [${n.classification}]`,
                    description: n.note,
                    actor: n.authorName || 'Investigator',
                    badgeColor: '#7c3aed'
                });
            });
        }

        // Sort chronologically (oldest to newest)
        events.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.status(200).json({
            caseId: caseItem._id,
            caseNumber: caseItem.caseNumber,
            caseTitle: caseItem.title,
            timeline: events
        });
    } catch (error) {
        console.error('Case timeline error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Export Official Courtroom Case Dossier & Chain of Custody Certificate
// @route   GET /api/cases/:id/export
// @access  Private
exports.exportCaseDossier = async (req, res) => {
    try {
        const caseItem = await Case.findById(req.params.id)
            .populate('assignedTo', 'name email role badgeNumber')
            .populate('createdBy', 'name email role badgeNumber');

        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }

        const evidence = await Evidence.find({ caseId: req.params.id })
            .populate('uploader', 'name email role badgeNumber');

        const dossier = {
            certificateId: `FORENSIC-CERT-${Date.now().toString(36).toUpperCase()}`,
            generatedAt: new Date().toISOString(),
            caseDetails: {
                id: caseItem._id,
                caseNumber: caseItem.caseNumber || `CASE-${new Date().getFullYear()}-001`,
                title: caseItem.title,
                description: caseItem.description,
                status: caseItem.status,
                priority: caseItem.priority,
                tags: caseItem.tags || [],
                courtReference: caseItem.courtReference || 'PENDING SUBMISSION',
                incidentDate: caseItem.incidentDate,
                leadInvestigator: caseItem.assignedTo?.name || 'Unassigned',
                supervisingOfficer: caseItem.createdBy?.name || 'Administrator',
            },
            evidenceInventory: evidence.map((ev, index) => ({
                itemNumber: `ITEM-${String(index + 1).padStart(3, '0')}`,
                fileName: ev.fileName,
                fileType: ev.fileType,
                fileSize: ev.fileSize,
                classification: ev.classification || 'Confidential',
                sha256Digest: ev.fileHash,
                md5Digest: ev.md5Hash || 'N/A',
                sha1Digest: ev.sha1Hash || 'N/A',
                uploadedBy: ev.uploader?.name || 'Investigator',
                uploadedAt: ev.uploadedAt,
                chainOfCustodyBlocks: (ev.chainOfCustody || []).map(b => ({
                    index: b.blockIndex,
                    timestamp: b.timestamp,
                    action: b.action,
                    custodian: b.custodian?.name,
                    role: b.custodian?.role,
                    notes: b.notes,
                    hash: b.hash
                }))
            })),
            integrityCertification: {
                sealType: 'SHA-256 Merkle-Linked Chain of Custody',
                complianceStandard: 'ISO/IEC 27037:2012 Digital Evidence Handling',
                verifiedBy: req.user ? req.user.name : 'Forensic Examiner',
                badgeNumber: req.user?.badgeNumber || 'FE-9081'
            }
        };

        res.status(200).json(dossier);
    } catch (error) {
        console.error('Export dossier error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get aggregate forensic case analytics & stats
// @route   GET /api/cases/stats/analytics
// @access  Private
exports.getCaseAnalytics = async (req, res) => {
    try {
        const totalCases = await Case.countDocuments();
        const openCases = await Case.countDocuments({ status: { $in: ['Open', 'open'] } });
        const inProgressCases = await Case.countDocuments({ status: { $in: ['In Progress', 'in_progress', 'in progress'] } });
        const closedCases = await Case.countDocuments({ status: { $in: ['Closed', 'closed'] } });
        const criticalCases = await Case.countDocuments({ priority: { $in: ['Critical', 'critical'] } });
        const highCases = await Case.countDocuments({ priority: { $in: ['High', 'high'] } });

        const totalEvidence = await Evidence.countDocuments();
        const clearanceRate = totalCases > 0 ? Math.round((closedCases / totalCases) * 100) : 0;

        res.status(200).json({
            totalCases,
            openCases,
            inProgressCases,
            closedCases,
            criticalCases,
            highCases,
            totalEvidence,
            clearanceRate
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
