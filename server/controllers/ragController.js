const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const AuditLog = require('../models/AuditLog');
const { retrieveRelevantChunks, extractTextFromBuffer } = require('../services/ragService');
const { runInvestigatorAgent, runRagQueryAgent, runReportSynthesizerAgent } = require('../services/forensicAgents');
const https = require('https');

/**
 * Helper to fetch file content buffer from Cloudinary URL or local storage.
 */
const fetchFileBuffer = (url) => {
    return new Promise((resolve) => {
        if (!url || !url.startsWith('http')) return resolve(null);
        https.get(url, (res) => {
            if (res.statusCode !== 200) return resolve(null);
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', () => resolve(null));
    });
};

// @desc    RAG Query over Case Evidence
// @route   POST /api/rag/query
// @access  Private
exports.queryCaseEvidence = async (req, res) => {
    try {
        const { caseId, query } = req.body;

        if (!caseId || !query) {
            return res.status(400).json({ message: 'caseId and query are required' });
        }

        const caseItem = await Case.findById(caseId);
        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }

        const evidenceItems = await Evidence.find({ caseId }).populate('uploader', 'name email');

        // Extract text content and media parts for each evidence file
        const processedItems = await Promise.all(evidenceItems.map(async (item) => {
            let text = item.description || '';
            let mediaPart = null;

            if (item.filePath) {
                const buf = await fetchFileBuffer(item.filePath);
                if (buf) {
                    const extracted = await extractTextFromBuffer(buf, item.fileType, item.fileName);
                    text += '\n' + extracted;

                    // If image, attach inlineData base64 part for Gemini Vision AI
                    if (item.fileName && item.fileName.match(/\.(png|jpg|jpeg|webp|gif)$/i)) {
                        mediaPart = {
                            inlineData: {
                                data: buf.toString('base64'),
                                mimeType: item.fileType || 'image/png'
                            }
                        };
                    }
                }
            }
            return {
                _id: item._id,
                fileName: item.fileName,
                fileHash: item.fileHash,
                uploader: item.uploader ? item.uploader.name : 'Unknown',
                textContent: text,
                mediaPart: mediaPart
            };
        }));

        // Retrieve top-4 relevant chunks
        const topChunks = retrieveRelevantChunks(query, processedItems, 4);

        // Run RAG Query Agent
        const ragResult = await runRagQueryAgent(query, topChunks, caseItem.title);

        // Audit Log
        await AuditLog.create({
            user: req.user ? req.user._id : null,
            action: 'RAG_EVIDENCE_QUERY',
            details: `AI RAG query for case "${caseItem.title}": "${query}"`,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        }).catch(err => console.error(err));

        res.status(200).json(ragResult);
    } catch (error) {
        console.error('RAG Query Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Run Forensic Investigator Agent on Case
// @route   GET /api/rag/case/:caseId/investigate
// @access  Private
exports.investigateCase = async (req, res) => {
    try {
        const caseId = req.params.caseId;
        const caseItem = await Case.findById(caseId);
        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }

        const evidenceItems = await Evidence.find({ caseId });
        let combinedText = `Case Title: ${caseItem.title}\nDescription: ${caseItem.description}\n`;

        for (const item of evidenceItems) {
            combinedText += `\nFile: ${item.fileName}\nDescription: ${item.description || ''}\n`;
            if (item.filePath) {
                const buf = await fetchFileBuffer(item.filePath);
                if (buf) {
                    const extracted = await extractTextFromBuffer(buf, item.fileType, item.fileName);
                    combinedText += extracted + '\n';
                }
            }
        }

        const analysis = await runInvestigatorAgent(combinedText);
        res.status(200).json(analysis);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate Forensic Case Report
// @route   POST /api/rag/case/:caseId/report
// @access  Private
exports.generateCaseReport = async (req, res) => {
    try {
        const caseId = req.params.caseId;
        const caseItem = await Case.findById(caseId).populate('assignedTo createdBy', 'name email');
        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }

        const evidenceItems = await Evidence.find({ caseId }).populate('uploader', 'name email');
        const reportMarkdown = await runReportSynthesizerAgent(caseItem, evidenceItems);

        res.status(200).json({ report: reportMarkdown });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
