const crypto = require('crypto');
const https = require('https');
const Evidence = require('../models/Evidence');
const Case = require('../models/Case');
const Notification = require('../models/Notification');
const { getRedisClient } = require('../config/redis');
const escapeRegex = require('../utils/escapeRegex');
const { createBlock, verifyChain } = require('../utils/custodyChain');
const { canAccessCase, loadCaseForUser } = require('../utils/caseAccess');
const { mapWithConcurrency } = require('../utils/concurrency');
const { uploadBuffer, getSignedUrl, hashRemote, safeFileName } = require('../utils/storage');

const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/', 'text/', 'application/'];

const computeHashes = (buffer) => ({
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
    md5: crypto.createHash('md5').update(buffer).digest('hex'),
    sha1: crypto.createHash('sha1').update(buffer).digest('hex')
});

/** Shannon entropy in bits per byte (0 = uniform, 8 = random/encrypted). */
const computeEntropy = (buffer) => {
    if (!buffer.length) return 0;
    const counts = new Uint32Array(256);
    for (const b of buffer) counts[b]++;
    let entropy = 0;
    for (const c of counts) {
        if (!c) continue;
        const p = c / buffer.length;
        entropy -= p * Math.log2(p);
    }
    return Math.round(entropy * 1000) / 1000;
};

const custodianFromUser = (user) => ({
    id: user._id,
    name: user.name,
    role: user.role,
    badgeNumber: user.badgeId || `INV-${String(user._id).slice(-4).toUpperCase()}`
});

const invalidateEvidenceCache = async (caseId) => {
    const client = getRedisClient();
    if (!client) return;
    try {
        await client.del(`case:evidence:${caseId}`);
    } catch (err) {
        console.error(`Failed to invalidate evidence cache: ${caseId}`, err.message);
    }
};

/** Load evidence and enforce that the requester can access its parent case. */
const loadEvidenceForUser = async (req, res, id) => {
    const evidence = await Evidence.findById(id);
    if (!evidence) {
        res.status(404).json({ message: 'Evidence not found' });
        return null;
    }
    const caseItem = await Case.findById(evidence.caseId).select('createdBy assignedTo');
    if (!canAccessCase(req.user, caseItem)) {
        res.status(403).json({ message: 'You do not have access to this evidence' });
        return null;
    }
    return evidence;
};

// @desc    Upload evidence: hash, seal, store as authenticated asset, open custody ledger
// @route   POST /api/evidence
// @access  Private (Admin, Investigator)
exports.uploadEvidence = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }
        if (!ALLOWED_MIME_PREFIXES.some(p => req.file.mimetype.startsWith(p))) {
            return res.status(400).json({ message: `Unsupported file type: ${req.file.mimetype}` });
        }

        const { caseId, description, classification = 'Confidential', tags = [] } = req.body;
        const caseItem = await loadCaseForUser(Case, req, res, caseId);
        if (!caseItem) return;

        const hashes = computeHashes(req.file.buffer);
        const entropy = computeEntropy(req.file.buffer);

        const uploadResult = await uploadBuffer(req.file.buffer, {
            folder: 'secure-digital-evidence',
            publicId: `${Date.now()}-${safeFileName(req.file.originalname)}`
        });

        const genesis = createBlock({
            prevBlock: null,
            action: 'EVIDENCE_INGESTED',
            custodian: custodianFromUser(req.user),
            notes: description || 'Initial evidence seizure and cryptographic hashing into vault.',
            fileHash: hashes.sha256
        });

        const parsedTags = Array.isArray(tags)
            ? tags
            : String(tags).split(',').map(t => t.trim()).filter(Boolean);

        const evidence = await Evidence.create({
            caseId,
            uploader: req.user.id,
            fileName: req.file.originalname,
            filePath: uploadResult.secure_url,
            storagePublicId: uploadResult.public_id,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            description,
            fileHash: hashes.sha256,
            md5Hash: hashes.md5,
            sha1Hash: hashes.sha1,
            classification,
            tags: parsedTags,
            metadata: {
                mimeType: req.file.mimetype,
                extension: req.file.originalname.includes('.') ? req.file.originalname.split('.').pop().toLowerCase() : '',
                fileEntropy: entropy
            },
            chainOfCustody: [genesis]
        });

        await invalidateEvidenceCache(caseId);

        // Notify the case owner (and assignee) that new evidence landed
        const io = req.app.get('socketio');
        const recipients = new Set([String(caseItem.createdBy), caseItem.assignedTo && String(caseItem.assignedTo)].filter(Boolean));
        recipients.delete(String(req.user._id));
        for (const recipient of recipients) {
            try {
                const notification = await Notification.create({
                    recipient,
                    message: `New evidence "${req.file.originalname}" uploaded to case ${caseItem.caseNumber || caseItem.title}`,
                    type: 'info',
                    relatedLink: `/cases/${caseId}`
                });
                if (io) io.to(recipient).emit('notification', notification);
            } catch (notifError) {
                console.error('Notification error:', notifError.message);
            }
        }

        res.status(201).json(evidence);
    } catch (error) {
        console.error('Evidence upload error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get evidence across all accessible cases with filtering
// @route   GET /api/evidence
// @access  Private
exports.getAllEvidence = async (req, res) => {
    try {
        const { search, category, classification, caseId } = req.query;
        const query = {};

        // Investigators only see evidence for cases they can access
        if (req.user.role === 'investigator') {
            const ownCases = await Case.find({
                $or: [{ assignedTo: req.user._id }, { createdBy: req.user._id }]
            }).select('_id');
            query.caseId = { $in: ownCases.map(c => c._id) };
        }
        if (caseId) {
            query.caseId = query.caseId ? { $in: query.caseId.$in.filter(id => String(id) === caseId) } : caseId;
        }
        if (classification && classification !== 'All') {
            query.classification = classification;
        }
        if (search) {
            const safe = escapeRegex(search);
            query.$or = [
                { fileName: { $regex: safe, $options: 'i' } },
                { fileHash: { $regex: safe, $options: 'i' } },
                { description: { $regex: safe, $options: 'i' } }
            ];
        }

        let evidenceList = await Evidence.find(query)
            .populate('uploader', 'name email role')
            .populate('caseId', 'title caseNumber status priority')
            .sort({ uploadedAt: -1 })
            .limit(500);

        if (category && category !== 'All') {
            evidenceList = evidenceList.filter(ev => {
                const mime = (ev.fileType || '').toLowerCase();
                const name = (ev.fileName || '').toLowerCase();
                if (category === 'Images') return mime.includes('image') || /\.(png|jpe?g|webp|gif|bmp|svg)$/.test(name);
                if (category === 'Documents') return mime.includes('pdf') || mime.includes('text') || /\.(pdf|docx?|txt|rtf|csv)$/.test(name);
                if (category === 'Media') return mime.includes('video') || mime.includes('audio') || /\.(mp4|webm|mov|mp3|wav)$/.test(name);
                if (category === 'Code/Logs') return mime.includes('json') || /\.(log|json|xml|py|js|sh|pcap|bin)$/.test(name);
                return true;
            });
        }

        res.status(200).json(evidenceList);
    } catch (error) {
        console.error('Get all evidence error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get evidence for a specific case
// @route   GET /api/evidence/:caseId/list
// @access  Private (case members)
exports.getCaseEvidence = async (req, res) => {
    try {
        const caseItem = await loadCaseForUser(Case, req, res, req.params.caseId);
        if (!caseItem) return;

        const caseId = req.params.caseId;
        const client = getRedisClient();
        const cacheKey = `case:evidence:${caseId}`;

        if (client) {
            try {
                const cached = await client.get(cacheKey);
                if (cached) return res.status(200).json(JSON.parse(cached));
            } catch (err) {
                console.error(`Redis get cache error: ${caseId}`, err.message);
            }
        }

        const evidenceList = await Evidence.find({ caseId })
            .populate('uploader', 'name email role')
            .sort({ uploadedAt: -1 });

        if (client) {
            try {
                await client.set(cacheKey, JSON.stringify(evidenceList), { EX: 300 });
            } catch (err) {
                console.error(`Redis set cache error: ${caseId}`, err.message);
            }
        }

        res.status(200).json(evidenceList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/** Stream the stored file through the API so storage URLs never reach the client. */
const streamEvidence = (disposition) => async (req, res) => {
    try {
        const evidence = await loadEvidenceForUser(req, res, req.params.id);
        if (!evidence) return;

        const url = getSignedUrl(evidence, 60);
        https.get(url, (upstream) => {
            if (upstream.statusCode !== 200) {
                upstream.resume();
                return res.status(502).json({ message: 'Storage backend did not return the file' });
            }
            res.setHeader('Content-Type', evidence.fileType || 'application/octet-stream');
            res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(evidence.fileName)}"`);
            res.setHeader('Cache-Control', 'private, no-store');
            if (upstream.headers['content-length']) res.setHeader('Content-Length', upstream.headers['content-length']);
            upstream.pipe(res);
        }).on('error', (err) => {
            res.status(502).json({ message: `Download failed: ${err.message}` });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Download evidence as an attachment
// @route   GET /api/evidence/:id/download
// @access  Private (case members)
exports.downloadEvidence = streamEvidence('attachment');

// @desc    Inline preview (images, video, audio, PDF) for the inspector
// @route   GET /api/evidence/:id/preview
// @access  Private (case members)
exports.previewEvidence = streamEvidence('inline');

// @desc    Verify a single file against its stored SHA-256 seal
// @route   GET /api/evidence/:id/verify
// @access  Private (case members)
exports.verifyEvidence = async (req, res) => {
    try {
        const evidence = await loadEvidenceForUser(req, res, req.params.id);
        if (!evidence) return;

        const currentHash = await hashRemote(getSignedUrl(evidence));
        if (!currentHash) {
            return res.status(502).json({ message: 'Failed to download file for verification' });
        }
        const isIntact = currentHash === evidence.fileHash;

        res.status(200).json({
            verified: isIntact,
            originalHash: evidence.fileHash,
            currentHash,
            sha1: evidence.sha1Hash,
            md5: evidence.md5Hash,
            message: isIntact
                ? 'Cryptographic integrity verified. File matches its SHA-256 seal.'
                : 'WARNING: Integrity check failed — the file does NOT match its stored digest.'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Append a custody-transfer block to the ledger
// @route   POST /api/evidence/:id/custody/transfer
// @access  Private (Admin, Investigator; case members)
exports.transferCustody = async (req, res) => {
    try {
        const evidence = await loadEvidenceForUser(req, res, req.params.id);
        if (!evidence) return;

        const {
            recipientName,
            recipientRole = 'Forensic Specialist',
            badgeNumber = 'N/A',
            action = 'TRANSFER_OF_CUSTODY',
            notes = ''
        } = req.body;

        if (!recipientName) {
            return res.status(400).json({ message: 'recipientName is required' });
        }

        const chain = evidence.chainOfCustody || [];
        const prevBlock = chain.length ? chain[chain.length - 1] : null;

        const block = createBlock({
            prevBlock,
            action,
            custodian: { id: req.user._id, name: recipientName, role: recipientRole, badgeNumber },
            notes: notes || `Custody transferred to ${recipientName} (${recipientRole}) by ${req.user.name}.`,
            fileHash: evidence.fileHash
        });

        evidence.chainOfCustody.push(block);
        await evidence.save();
        await invalidateEvidenceCache(evidence.caseId);

        res.status(200).json({
            message: 'Custody transfer appended to cryptographic ledger',
            block,
            chainOfCustody: evidence.chainOfCustody
        });
    } catch (error) {
        console.error('Transfer custody error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify the custody ledger: links, indices and every block hash
// @route   GET /api/evidence/:id/custody/verify
// @access  Private (case members)
exports.verifyCustodyChain = async (req, res) => {
    try {
        const evidence = await loadEvidenceForUser(req, res, req.params.id);
        if (!evidence) return;

        const chain = evidence.chainOfCustody || [];
        const result = verifyChain(chain, evidence.fileHash);

        res.status(200).json({
            isChainValid: result.valid,
            totalBlocks: chain.length,
            brokenIndex: result.valid ? null : result.brokenIndex,
            chain,
            message: result.valid
                ? 'All chain-of-custody blocks verified from the genesis block.'
                : `TAMPER DETECTED at block ${result.brokenIndex}: ${result.reason}`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Batch integrity audit across all accessible evidence (bounded concurrency)
// @route   POST /api/evidence/batch-verify
// @access  Private (Admin, Analyst)
exports.batchVerify = async (req, res) => {
    try {
        const allEvidence = await Evidence.find({}).select('fileName fileHash filePath storagePublicId caseId uploadedAt chainOfCustody');

        const results = await mapWithConcurrency(allEvidence, 5, async (ev) => {
            const calculated = await hashRemote(getSignedUrl(ev));
            const chain = verifyChain(ev.chainOfCustody || [], ev.fileHash);
            const fileIntact = calculated !== null && calculated === ev.fileHash;
            return {
                id: ev._id,
                fileName: ev.fileName,
                caseId: ev.caseId,
                verified: fileIntact && chain.valid,
                fileIntact,
                chainValid: chain.valid,
                originalHash: ev.fileHash,
                calculatedHash: calculated,
                reason: calculated === null ? 'Download failed' : !fileIntact ? 'Hash mismatch' : !chain.valid ? chain.reason : undefined
            };
        });

        const total = results.length;
        const intactCount = results.filter(r => r.verified).length;

        res.status(200).json({
            totalScanned: total,
            intactCount,
            tamperedCount: total - intactCount,
            integrityScore: total > 0 ? Math.round((intactCount / total) * 100) : 100,
            results
        });
    } catch (error) {
        console.error('Batch verify error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Demo-only: corrupt a stored hash so tamper detection can be shown. Disabled in production.
// @route   PUT /api/evidence/:id/simulate-tamper
// @access  Private (Admin, non-production)
exports.simulateTampering = async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ message: 'Not available' });
    }
    try {
        const evidence = await Evidence.findById(req.params.id);
        if (!evidence) return res.status(404).json({ message: 'Evidence not found' });

        const chars = evidence.fileHash.split('');
        chars[0] = chars[0] === 'a' ? 'b' : 'a';
        evidence.fileHash = chars.join('');
        await evidence.save();
        await invalidateEvidenceCache(evidence.caseId);

        res.status(200).json({ message: 'Tampering simulated: the stored hash has been modified.', evidence });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
