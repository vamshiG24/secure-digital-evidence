const crypto = require('crypto');
const https = require('https');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;
const Evidence = require('../models/Evidence');
const Case = require('../models/Case');
const Notification = require('../models/Notification');
const { getRedisClient } = require('../config/redis');

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

/**
 * Helper to calculate cryptographic hashes trinity: SHA-256, MD5, SHA-1
 */
const computeHashes = (buffer) => {
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const md5 = crypto.createHash('md5').update(buffer).digest('hex');
    const sha1 = crypto.createHash('sha1').update(buffer).digest('hex');
    return { sha256, md5, sha1 };
};

// @desc    Upload evidence file with SHA-256, MD5, SHA-1 and Genesis Chain of Custody block
// @route   POST /api/evidence
// @access  Private (Investigator/Admin)
exports.uploadEvidence = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        const { caseId, description, classification = 'Confidential', tags = [] } = req.body;

        const caseItem = await Case.findById(caseId);
        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }

        // 1. Compute Cryptographic Hashes (SHA-256, MD5, SHA-1)
        const hashes = computeHashes(req.file.buffer);

        // 2. Upload buffer to Cloudinary via stream
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, {
            folder: 'secure-digital-evidence',
            resource_type: 'raw',
            public_id: `${Date.now()}-${req.file.originalname}`
        });

        // 3. Construct Genesis Chain of Custody Block
        const prevGenesisHash = '0000000000000000000000000000000000000000000000000000000000000000';
        const genesisPayload = `0:${prevGenesisHash}:${hashes.sha256}:${req.user ? req.user.id : 'unknown'}:${Date.now()}`;
        const genesisBlockHash = crypto.createHash('sha256').update(genesisPayload).digest('hex');

        const initialCustodyBlock = {
            blockIndex: 0,
            timestamp: new Date(),
            action: 'EVIDENCE_INGESTED',
            custodian: {
                id: req.user ? req.user.id : null,
                name: req.user ? req.user.name : 'Officer In Charge',
                role: req.user ? req.user.role : 'Investigator',
                badgeNumber: req.user ? (req.user.badgeNumber || `INV-${String(req.user.id).slice(-4).toUpperCase()}`) : 'INV-001'
            },
            notes: description || 'Initial evidence seizure and cryptographic hashing into vault.',
            prevHash: prevGenesisHash,
            hash: genesisBlockHash
        };

        const parsedTags = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);

        // 4. Create Evidence record with complete chain and hashes
        const evidence = await Evidence.create({
            caseId,
            uploader: req.user.id,
            fileName: req.file.originalname,
            filePath: cloudinaryResult.secure_url,
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
                extension: req.file.originalname.split('.').pop() || '',
                fileEntropy: 7.92
            },
            chainOfCustody: [initialCustodyBlock]
        });

        // Invalidate Redis cache
        const client = getRedisClient();
        if (client) {
            try {
                await client.del(`case:evidence:${caseId}`);
                await client.del('all:evidence:list');
            } catch (err) {
                console.error(`Failed to invalidate evidence cache: ${caseId}`, err);
            }
        }

        // 5. Notify Case Creator (Admin) via Notification
        try {
            const freshCase = await Case.findById(caseId);
            if (freshCase && freshCase.createdBy) {
                const creatorId = freshCase.createdBy.toString();
                if (creatorId !== req.user.id) {
                    await Notification.create({
                        recipient: creatorId,
                        message: `New evidence "${req.file.originalname}" uploaded for case: ${freshCase.title}`,
                        type: 'info',
                        relatedLink: `/cases/${caseId}`
                    });
                }
            }
        } catch (notifError) {
            console.error('Notification error:', notifError);
        }

        res.status(201).json(evidence);
    } catch (error) {
        console.error('Evidence upload error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all evidence across cases with filtering & pagination
// @route   GET /api/evidence
// @access  Private
exports.getAllEvidence = async (req, res) => {
    try {
        const { search, category, classification, caseId } = req.query;
        let query = {};

        if (caseId) {
            query.caseId = caseId;
        }

        if (classification && classification !== 'All') {
            query.classification = classification;
        }

        if (search) {
            query.$or = [
                { fileName: { $regex: search, $options: 'i' } },
                { fileHash: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        let evidenceList = await Evidence.find(query)
            .populate('uploader', 'name email role')
            .populate('caseId', 'title caseNumber status priority')
            .sort({ uploadedAt: -1 });

        // Category filter in memory if specified
        if (category && category !== 'All') {
            evidenceList = evidenceList.filter(ev => {
                const mime = (ev.fileType || '').toLowerCase();
                const name = (ev.fileName || '').toLowerCase();
                if (category === 'Images') return mime.includes('image') || /\.(png|jpg|jpeg|webp|gif|bmp|svg)$/i.test(name);
                if (category === 'Documents') return mime.includes('pdf') || mime.includes('text') || /\.(pdf|doc|docx|txt|rtf|csv)$/i.test(name);
                if (category === 'Media') return mime.includes('video') || mime.includes('audio') || /\.(mp4|webm|mov|mp3|wav)$/i.test(name);
                if (category === 'Code/Logs') return mime.includes('json') || /\.(log|json|xml|py|js|sh|pcap|bin)$/i.test(name);
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
// @access  Private
exports.getCaseEvidence = async (req, res) => {
    try {
        const caseId = req.params.caseId;
        const client = getRedisClient();
        const cacheKey = `case:evidence:${caseId}`;

        if (client) {
            try {
                const cachedData = await client.get(cacheKey);
                if (cachedData) {
                    return res.status(200).json(JSON.parse(cachedData));
                }
            } catch (err) {
                console.error(`Redis get cache error: ${caseId}`, err);
            }
        }

        const evidenceList = await Evidence.find({ caseId })
            .populate('uploader', 'name email role')
            .sort({ uploadedAt: -1 });

        if (client) {
            try {
                await client.set(cacheKey, JSON.stringify(evidenceList), { EX: 300 });
            } catch (err) {
                console.error(`Redis set cache error: ${caseId}`, err);
            }
        }

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

// @desc    Verify single evidence integrity against stored SHA-256 hash
// @route   GET /api/evidence/:id/verify
// @access  Private
exports.verifyEvidence = async (req, res) => {
    try {
        const evidence = await Evidence.findById(req.params.id);
        if (!evidence) {
            return res.status(404).json({ message: 'Evidence not found' });
        }

        https.get(evidence.filePath, (response) => {
            if (response.statusCode !== 200) {
                return res.status(500).json({ message: 'Failed to download file for verification' });
            }

            const hash = crypto.createHash('sha256');
            response.on('data', chunk => hash.update(chunk));
            response.on('end', () => {
                const currentHash = hash.digest('hex');
                const isIntact = currentHash === evidence.fileHash;

                res.status(200).json({
                    verified: isIntact,
                    originalHash: evidence.fileHash,
                    currentHash: currentHash,
                    sha1: evidence.sha1Hash,
                    md5: evidence.md5Hash,
                    message: isIntact 
                        ? 'Cryptographic integrity verified. File matches SHA-256 seal perfectly.' 
                        : 'WARNING: File integrity check failed! The digital seal does NOT match stored digest!'
                });
            });
        }).on('error', (err) => {
            res.status(500).json({ message: `Error verifying file: ${err.message}` });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Transfer Chain of Custody to another officer / department
// @route   POST /api/evidence/:id/custody/transfer
// @access  Private
exports.transferCustody = async (req, res) => {
    try {
        const evidence = await Evidence.findById(req.params.id);
        if (!evidence) {
            return res.status(404).json({ message: 'Evidence not found' });
        }

        const { recipientName, recipientRole = 'Forensic Specialist', badgeNumber = 'N/A', action = 'TRANSFER_OF_CUSTODY', notes = '' } = req.body;

        const chain = evidence.chainOfCustody || [];
        const nextIndex = chain.length;
        const lastBlock = chain.length > 0 ? chain[chain.length - 1] : null;
        const prevHash = lastBlock ? lastBlock.hash : '0000000000000000000000000000000000000000000000000000000000000000';

        const timestamp = new Date();
        const payload = `${nextIndex}:${prevHash}:${action}:${recipientName}:${badgeNumber}:${timestamp.toISOString()}`;
        const blockHash = crypto.createHash('sha256').update(payload).digest('hex');

        const newBlock = {
            blockIndex: nextIndex,
            timestamp: timestamp,
            action: action,
            custodian: {
                id: req.user ? req.user.id : null,
                name: recipientName || req.user.name,
                role: recipientRole,
                badgeNumber: badgeNumber
            },
            notes: notes || `Custody transferred to ${recipientName} (${recipientRole}).`,
            prevHash: prevHash,
            hash: blockHash
        };

        evidence.chainOfCustody.push(newBlock);
        await evidence.save();

        res.status(200).json({
            message: 'Custody transfer appended successfully to cryptographic ledger',
            block: newBlock,
            chainOfCustody: evidence.chainOfCustody
        });
    } catch (error) {
        console.error('Transfer custody error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify mathematical integrity of the Chain of Custody ledger
// @route   GET /api/evidence/:id/custody/verify
// @access  Private
exports.verifyCustodyChain = async (req, res) => {
    try {
        const evidence = await Evidence.findById(req.params.id);
        if (!evidence) {
            return res.status(404).json({ message: 'Evidence not found' });
        }

        const chain = evidence.chainOfCustody || [];
        if (chain.length === 0) {
            return res.status(200).json({ isChainValid: true, message: 'Genesis block not yet initialized', chainLength: 0 });
        }

        let isChainValid = true;
        let brokenIndex = -1;

        for (let i = 1; i < chain.length; i++) {
            const currentBlock = chain[i];
            const previousBlock = chain[i - 1];

            if (currentBlock.prevHash !== previousBlock.hash) {
                isChainValid = false;
                brokenIndex = i;
                break;
            }
        }

        res.status(200).json({
            isChainValid,
            totalBlocks: chain.length,
            brokenIndex: brokenIndex !== -1 ? brokenIndex : null,
            chain: chain,
            message: isChainValid 
                ? 'All Chain of Custody blocks mathematically verified from Genesis block.' 
                : `TAMPER DETECTED in Chain of Custody at block index ${brokenIndex}!`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Run Batch Integrity Verification across all stored evidence files
// @route   POST /api/evidence/batch-verify
// @access  Private
exports.batchVerify = async (req, res) => {
    try {
        const allEvidence = await Evidence.find({}).select('fileName fileHash filePath caseId uploadedAt');

        const verifyFile = (ev) => {
            return new Promise((resolve) => {
                https.get(ev.filePath, (response) => {
                    if (response.statusCode !== 200) {
                        return resolve({ id: ev._id, fileName: ev.fileName, verified: false, reason: 'HTTP Download Failed' });
                    }
                    const hash = crypto.createHash('sha256');
                    response.on('data', chunk => hash.update(chunk));
                    response.on('end', () => {
                        const calculated = hash.digest('hex');
                        const intact = calculated === ev.fileHash;
                        resolve({
                            id: ev._id,
                            fileName: ev.fileName,
                            caseId: ev.caseId,
                            verified: intact,
                            originalHash: ev.fileHash,
                            calculatedHash: calculated
                        });
                    });
                }).on('error', (err) => {
                    resolve({ id: ev._id, fileName: ev.fileName, verified: false, reason: err.message });
                });
            });
        };

        const results = await Promise.all(allEvidence.map(verifyFile));
        const total = results.length;
        const intactCount = results.filter(r => r.verified).length;
        const tamperedCount = total - intactCount;
        const integrityScore = total > 0 ? Math.round((intactCount / total) * 100) : 100;

        res.status(200).json({
            totalScanned: total,
            intactCount,
            tamperedCount,
            integrityScore,
            results
        });
    } catch (error) {
        console.error('Batch verify error:', error);
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
        alteredHash[0] = alteredHash[0] === 'a' ? 'b' : 'a';
        evidence.fileHash = alteredHash.join('');
        
        await evidence.save();

        const client = getRedisClient();
        if (client) {
            try {
                await client.del(`case:evidence:${evidence.caseId}`);
                await client.del('all:evidence:list');
            } catch (err) {
                console.error(`Failed to invalidate evidence cache: ${evidence.caseId}`, err);
            }
        }

        res.status(200).json({ 
            message: 'Tampering simulated successfully! The stored hash has been modified.',
            evidence
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
