const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { getRedisClient } = require('../config/redis');
const { loadCaseForUser } = require('../utils/caseAccess');
const { deleteAsset } = require('../utils/storage');

const POPULATE_ASSIGNED = { path: 'assignedTo', select: 'name email role badgeId avatarUrl' };
const POPULATE_CREATOR = { path: 'createdBy', select: 'name email role badgeId avatarUrl' };

const clearCasesListCache = async () => {
    const client = getRedisClient();
    if (!client) return;
    try {
        const keys = [];
        for await (const key of client.scanIterator({ MATCH: 'cases:list:*' })) {
            keys.push(...(Array.isArray(key) ? key : [key]));
        }
        if (keys.length) await client.del(keys);
    } catch (err) {
        console.error('Failed to clear cases list cache:', err.message);
    }
};

const clearCaseCache = async (caseId) => {
    const client = getRedisClient();
    if (!client) return;
    try {
        await clearCasesListCache();
        await client.del(`case:detail:${caseId}`);
        await client.del(`case:evidence:${caseId}`);
    } catch (err) {
        console.error(`Failed to invalidate cache for case ${caseId}:`, err.message);
    }
};

const notifyAssignment = async (req, caseItem, assignedTo) => {
    if (!assignedTo || String(assignedTo) === String(req.user._id)) return;
    try {
        const notification = await Notification.create({
            recipient: assignedTo,
            message: `You have been assigned to case [${caseItem.caseNumber}]: ${caseItem.title}`,
            type: 'info',
            relatedLink: `/cases/${caseItem._id}`
        });
        const io = req.app.get('socketio');
        if (io) io.to(String(assignedTo)).emit('notification', notification);
    } catch (err) {
        console.error('Notification creation error:', err.message);
    }
};

// @desc    List cases (admin/analyst: all; investigator: assigned or created)
// @route   GET /api/cases
// @access  Private
exports.getCases = async (req, res) => {
    try {
        const client = getRedisClient();
        const cacheKey = `cases:list:${req.user.id}`;

        if (client) {
            try {
                const cached = await client.get(cacheKey);
                if (cached) return res.status(200).json(JSON.parse(cached));
            } catch (err) {
                console.error('Redis get cache error for cases list:', err.message);
            }
        }

        const query = ['admin', 'analyst'].includes(req.user.role)
            ? {}
            : { $or: [{ assignedTo: req.user.id }, { createdBy: req.user.id }] };

        const cases = await Case.find(query)
            .populate(POPULATE_ASSIGNED)
            .populate(POPULATE_CREATOR)
            .sort({ createdAt: -1 });

        if (client) {
            try {
                await client.set(cacheKey, JSON.stringify(cases), { EX: 120 });
            } catch (err) {
                console.error('Redis set cache error:', err.message);
            }
        }

        res.status(200).json(cases);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single case
// @route   GET /api/cases/:id
// @access  Private (case members)
exports.getCase = async (req, res) => {
    try {
        const caseItem = await loadCaseForUser(Case, req, res, req.params.id, [POPULATE_ASSIGNED, POPULATE_CREATOR]);
        if (!caseItem) return;
        res.status(200).json(caseItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create case
// @route   POST /api/cases
// @access  Private (Admin, Investigator)
exports.createCase = async (req, res) => {
    try {
        const { title, description, priority, status, assignedTo, tags, incidentDate, courtReference } = req.body;

        const caseItem = await Case.create({
            title,
            description,
            priority: priority || 'Medium',
            status: status || 'Open',
            assignedTo: assignedTo || undefined,
            createdBy: req.user.id,
            tags: Array.isArray(tags) && tags.length ? tags : ['Digital Forensics'],
            incidentDate: incidentDate || new Date(),
            courtReference: courtReference || ''
        });

        await notifyAssignment(req, caseItem, assignedTo);
        await clearCasesListCache();

        const populated = await Case.findById(caseItem._id).populate(POPULATE_ASSIGNED).populate(POPULATE_CREATOR);
        res.status(201).json(populated);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join(', ') });
        }
        console.error('Error in createCase:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update case (whitelisted fields only)
// @route   PUT /api/cases/:id
// @access  Private (Admin, Investigator; case members)
exports.updateCase = async (req, res) => {
    try {
        const caseItem = await loadCaseForUser(Case, req, res, req.params.id);
        if (!caseItem) return;

        const EDITABLE = ['title', 'description', 'status', 'priority', 'tags', 'incidentDate', 'courtReference', 'assignedTo'];
        const previousAssignee = caseItem.assignedTo ? String(caseItem.assignedTo) : null;

        for (const field of EDITABLE) {
            if (req.body[field] === undefined) continue;
            if (field === 'assignedTo' && !req.body.assignedTo) {
                caseItem.assignedTo = undefined;
            } else {
                caseItem[field] = req.body[field];
            }
        }

        await caseItem.save();
        await clearCaseCache(req.params.id);

        const newAssignee = caseItem.assignedTo ? String(caseItem.assignedTo) : null;
        if (newAssignee && newAssignee !== previousAssignee) {
            await notifyAssignment(req, caseItem, newAssignee);
        }

        const populated = await Case.findById(caseItem._id).populate(POPULATE_ASSIGNED).populate(POPULATE_CREATOR);
        res.status(200).json(populated);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join(', ') });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete case and everything attached to it
// @route   DELETE /api/cases/:id
// @access  Private (Admin)
exports.deleteCase = async (req, res) => {
    try {
        const caseItem = await Case.findById(req.params.id);
        if (!caseItem) return res.status(404).json({ message: 'Case not found' });

        const evidence = await Evidence.find({ caseId: caseItem._id }).select('storagePublicId');
        await Promise.all(evidence.map(deleteAsset));

        await Promise.all([
            Evidence.deleteMany({ caseId: caseItem._id }),
            Message.deleteMany({ caseId: caseItem._id }),
            Notification.deleteMany({ relatedLink: `/cases/${caseItem._id}` }),
            caseItem.deleteOne()
        ]);

        await clearCaseCache(req.params.id);
        res.status(200).json({ message: 'Case and all associated records removed', removedEvidence: evidence.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get case chat messages
// @route   GET /api/cases/:id/messages
// @access  Private (case members)
exports.getCaseMessages = async (req, res) => {
    try {
        const caseItem = await loadCaseForUser(Case, req, res, req.params.id);
        if (!caseItem) return;

        const messages = await Message.find({ caseId: req.params.id })
            .populate('sender', 'name email role avatarUrl')
            .sort({ createdAt: 1 })
            .limit(500);
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send case chat message
// @route   POST /api/cases/:id/messages
// @access  Private (case members)
exports.sendCaseMessage = async (req, res) => {
    try {
        const caseItem = await loadCaseForUser(Case, req, res, req.params.id);
        if (!caseItem) return;

        const message = String(req.body.message || '').trim();
        if (!message) return res.status(400).json({ message: 'Message cannot be empty' });
        if (message.length > 4000) return res.status(400).json({ message: 'Message is too long' });

        const created = await Message.create({ caseId: caseItem._id, sender: req.user.id, message });
        const populated = await Message.findById(created._id).populate('sender', 'name email role avatarUrl');

        const io = req.app.get('socketio');
        if (io) io.to(String(caseItem._id)).emit('new_message', populated);

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add investigator note
// @route   POST /api/cases/:id/notes
// @access  Private (Admin, Investigator; case members)
exports.addCaseNote = async (req, res) => {
    try {
        const caseItem = await loadCaseForUser(Case, req, res, req.params.id);
        if (!caseItem) return;

        const { note, classification = 'Routine' } = req.body;
        if (!note || !String(note).trim()) return res.status(400).json({ message: 'Note cannot be empty' });

        caseItem.investigatorNotes.push({
            author: req.user.id,
            authorName: req.user.name || 'Investigator',
            note: String(note).trim(),
            classification,
            createdAt: new Date()
        });
        await caseItem.save();
        await clearCaseCache(req.params.id);

        res.status(201).json({ message: 'Note added successfully', notes: caseItem.investigatorNotes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Chronological forensic timeline
// @route   GET /api/cases/:id/timeline
// @access  Private (case members)
exports.getCaseTimeline = async (req, res) => {
    try {
        const caseItem = await loadCaseForUser(Case, req, res, req.params.id, [
            { path: 'createdBy', select: 'name role' },
            { path: 'assignedTo', select: 'name role' }
        ]);
        if (!caseItem) return;

        const evidence = await Evidence.find({ caseId: req.params.id }).populate('uploader', 'name role');
        const events = [];

        events.push({
            id: `case-create-${caseItem._id}`,
            date: caseItem.createdAt,
            type: 'CASE_CREATION',
            title: `Case Initiated (${caseItem.caseNumber || 'CASE-INITIAL'})`,
            description: `Case "${caseItem.title}" registered by ${caseItem.createdBy?.name || 'Administrator'}. Priority set to ${caseItem.priority}.`,
            actor: caseItem.createdBy?.name || 'System',
            badgeColor: '#1d4ed8'
        });

        evidence.forEach(ev => {
            events.push({
                id: `ev-upload-${ev._id}`,
                date: ev.uploadedAt,
                type: 'EVIDENCE_INGESTED',
                title: `Evidence Seized: ${ev.fileName}`,
                description: `File ingested with SHA-256 seal [${ev.fileHash.slice(0, 16)}…]. Size: ${(ev.fileSize / 1024).toFixed(1)} KB.`,
                actor: ev.uploader?.name || 'Investigator',
                evidenceId: ev._id,
                badgeColor: '#16a34a'
            });

            (ev.chainOfCustody || []).slice(1).forEach(block => {
                events.push({
                    id: `block-${block._id || block.hash}`,
                    date: block.timestamp,
                    type: block.action,
                    title: `Custody Transfer: ${ev.fileName}`,
                    description: `Transferred to ${block.custodian?.name || 'Custodian'} (${block.custodian?.role || 'Specialist'}). ${block.notes || ''}`,
                    actor: block.custodian?.name || 'Custodian',
                    evidenceId: ev._id,
                    badgeColor: '#ca8a04'
                });
            });
        });

        (caseItem.investigatorNotes || []).forEach(n => {
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

// @desc    Export courtroom dossier & chain-of-custody certificate
// @route   GET /api/cases/:id/export
// @access  Private (case members)
exports.exportCaseDossier = async (req, res) => {
    try {
        const caseItem = await loadCaseForUser(Case, req, res, req.params.id, [POPULATE_ASSIGNED, POPULATE_CREATOR]);
        if (!caseItem) return;

        const evidence = await Evidence.find({ caseId: req.params.id }).populate('uploader', 'name email role badgeId');
        const { verifyChain } = require('../utils/custodyChain');

        const evidenceInventory = evidence.map((ev, index) => {
            const chain = verifyChain(ev.chainOfCustody || [], ev.fileHash);
            return {
                itemNumber: `ITEM-${String(index + 1).padStart(3, '0')}`,
                fileName: ev.fileName,
                fileType: ev.fileType,
                fileSize: ev.fileSize,
                classification: ev.classification || 'Confidential',
                sha256Digest: ev.fileHash,
                md5Digest: ev.md5Hash || 'N/A',
                sha1Digest: ev.sha1Hash || 'N/A',
                fileEntropy: ev.metadata?.fileEntropy ?? null,
                uploadedBy: ev.uploader?.name || 'Investigator',
                uploadedAt: ev.uploadedAt,
                ledgerIntegrity: chain.valid ? 'VERIFIED' : `BROKEN (${chain.reason})`,
                chainOfCustodyBlocks: (ev.chainOfCustody || []).map(b => ({
                    index: b.blockIndex,
                    timestamp: b.timestamp,
                    action: b.action,
                    custodian: b.custodian?.name,
                    role: b.custodian?.role,
                    badgeNumber: b.custodian?.badgeNumber,
                    notes: b.notes,
                    prevHash: b.prevHash,
                    hash: b.hash
                }))
            };
        });

        const allLedgersValid = evidenceInventory.every(i => i.ledgerIntegrity === 'VERIFIED');

        res.status(200).json({
            certificateId: `FORENSIC-CERT-${Date.now().toString(36).toUpperCase()}`,
            generatedAt: new Date().toISOString(),
            caseDetails: {
                id: caseItem._id,
                caseNumber: caseItem.caseNumber,
                title: caseItem.title,
                description: caseItem.description,
                status: caseItem.status,
                priority: caseItem.priority,
                tags: caseItem.tags || [],
                courtReference: caseItem.courtReference || 'PENDING SUBMISSION',
                incidentDate: caseItem.incidentDate,
                leadInvestigator: caseItem.assignedTo?.name || 'Unassigned',
                supervisingOfficer: caseItem.createdBy?.name || 'Administrator'
            },
            evidenceInventory,
            integrityCertification: {
                sealType: 'SHA-256 hash-linked chain of custody',
                ledgerStatus: allLedgersValid ? 'ALL LEDGERS VERIFIED' : 'ONE OR MORE LEDGERS FAILED VERIFICATION',
                note: 'File contents are verified separately via the integrity audit; this certificate attests to ledger consistency at generation time.',
                generatedBy: req.user.name,
                badgeNumber: req.user.badgeId || 'N/A'
            }
        });
    } catch (error) {
        console.error('Export dossier error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Aggregate analytics (scoped to what the requester can see)
// @route   GET /api/cases/stats/analytics
// @access  Private
exports.getCaseAnalytics = async (req, res) => {
    try {
        const match = ['admin', 'analyst'].includes(req.user.role)
            ? {}
            : { $or: [{ assignedTo: req.user._id }, { createdBy: req.user._id }] };

        const [stats] = await Case.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalCases: { $sum: 1 },
                    openCases: { $sum: { $cond: [{ $eq: ['$status', 'Open'] }, 1, 0] } },
                    inProgressCases: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
                    closedCases: { $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] } },
                    criticalCases: { $sum: { $cond: [{ $eq: ['$priority', 'Critical'] }, 1, 0] } },
                    highCases: { $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] } },
                    caseIds: { $push: '$_id' }
                }
            }
        ]);

        const base = stats || { totalCases: 0, openCases: 0, inProgressCases: 0, closedCases: 0, criticalCases: 0, highCases: 0, caseIds: [] };
        const totalEvidence = await Evidence.countDocuments(Object.keys(match).length ? { caseId: { $in: base.caseIds } } : {});

        res.status(200).json({
            totalCases: base.totalCases,
            openCases: base.openCases,
            inProgressCases: base.inProgressCases,
            closedCases: base.closedCases,
            criticalCases: base.criticalCases,
            highCases: base.highCases,
            totalEvidence,
            clearanceRate: base.totalCases > 0 ? Math.round((base.closedCases / base.totalCases) * 100) : 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
