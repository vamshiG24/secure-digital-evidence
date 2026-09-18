const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const AuditLog = require('../models/AuditLog');
const { retrieveRelevantChunks, extractTextFromBuffer } = require('../services/ragService');
const { runInvestigatorAgent, runRagQueryAgent, runReportSynthesizerAgent } = require('../services/forensicAgents');
const { loadCaseForUser } = require('../utils/caseAccess');
const { getSignedUrl, fetchBuffer } = require('../utils/storage');
const { mapWithConcurrency } = require('../utils/concurrency');
const { getRedisClient } = require('../config/redis');

const MAX_INLINE_IMAGE_BYTES = 4 * 1024 * 1024;
const TEXT_CACHE_TTL = 60 * 60; // 1h

/**
 * Download + extract text for an evidence item, caching the extracted text in
 * Redis keyed by file hash so repeated queries do not re-download every file.
 */
const loadEvidenceContent = async (item, { includeMedia = false } = {}) => {
    const client = getRedisClient();
    const cacheKey = `rag:text:${item.fileHash}`;
    let text = null;

    if (client) {
        try { text = await client.get(cacheKey); } catch { /* cache miss */ }
    }

    let buffer = null;
    if (text === null || includeMedia) {
        buffer = await fetchBuffer(getSignedUrl(item));
    }

    if (text === null) {
        text = buffer ? await extractTextFromBuffer(buffer, item.fileType, item.fileName) : '';
        if (client) {
            try { await client.set(cacheKey, text, { EX: TEXT_CACHE_TTL }); } catch { /* ignore */ }
        }
    }

    let mediaPart = null;
    const isImage = /^image\//.test(item.fileType || '') || /\.(png|jpe?g|webp|gif)$/i.test(item.fileName || '');
    if (includeMedia && buffer && isImage && buffer.length <= MAX_INLINE_IMAGE_BYTES) {
        mediaPart = { inlineData: { data: buffer.toString('base64'), mimeType: item.fileType || 'image/png' } };
    }

    return { text: `${item.description || ''}\n${text}`.trim(), mediaPart };
};

// @desc    RAG query over case evidence
// @route   POST /api/rag/query
// @access  Private (case members)
exports.queryCaseEvidence = async (req, res) => {
    try {
        const { caseId, query } = req.body;
        if (!caseId || !query) {
            return res.status(400).json({ message: 'caseId and query are required' });
        }

        const caseItem = await loadCaseForUser(Case, req, res, caseId);
        if (!caseItem) return;

        const evidenceItems = await Evidence.find({ caseId }).populate('uploader', 'name email');

        const processedItems = await mapWithConcurrency(evidenceItems, 4, async (item) => {
            const { text, mediaPart } = await loadEvidenceContent(item, { includeMedia: true });
            return {
                _id: item._id,
                fileName: item.fileName,
                fileHash: item.fileHash,
                uploader: item.uploader ? item.uploader.name : 'Unknown',
                textContent: text,
                mediaPart
            };
        });

        const topChunks = retrieveRelevantChunks(String(query).slice(0, 2000), processedItems, 4);
        const ragResult = await runRagQueryAgent(String(query).slice(0, 2000), topChunks, caseItem.title);

        AuditLog.create({
            user: req.user._id,
            action: 'RAG_EVIDENCE_QUERY',
            details: `AI RAG query for case "${caseItem.title}": "${String(query).slice(0, 200)}"`,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        }).catch(err => console.error(err.message));

        res.status(200).json(ragResult);
    } catch (error) {
        console.error('RAG Query Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Forensic investigator agent (entity extraction + AI insights)
// @route   GET /api/rag/case/:caseId/investigate
// @access  Private (case members)
exports.investigateCase = async (req, res) => {
    try {
        const caseItem = await loadCaseForUser(Case, req, res, req.params.caseId);
        if (!caseItem) return;

        const evidenceItems = await Evidence.find({ caseId: caseItem._id });
        const contents = await mapWithConcurrency(evidenceItems, 4, async (item) => {
            const { text } = await loadEvidenceContent(item);
            return `\nFile: ${item.fileName}\n${text}\n`;
        });

        const combinedText = `Case Title: ${caseItem.title}\nDescription: ${caseItem.description}\n${contents.join('')}`;
        const analysis = await runInvestigatorAgent(combinedText);

        AuditLog.create({
            user: req.user._id,
            action: 'AI_FORENSIC_INSPECTION',
            details: `Forensic inspector run on case "${caseItem.title}"`,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        }).catch(err => console.error(err.message));

        res.status(200).json(analysis);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate forensic case report (AI-synthesised when configured)
// @route   POST /api/rag/case/:caseId/report
// @access  Private (case members)
exports.generateCaseReport = async (req, res) => {
    try {
        const caseItem = await loadCaseForUser(Case, req, res, req.params.caseId, 'assignedTo createdBy');
        if (!caseItem) return;

        const evidenceItems = await Evidence.find({ caseId: caseItem._id }).populate('uploader', 'name email');
        const reportMarkdown = await runReportSynthesizerAgent(caseItem, evidenceItems);

        res.status(200).json({ report: reportMarkdown });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
