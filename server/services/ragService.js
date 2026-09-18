const crypto = require('crypto');
const pdfParse = require('pdf-parse');

/**
 * Classify file type to determine if it is text, image, or video.
 */
const getMediaType = (mimeType = '', fileName = '') => {
    const fn = fileName.toLowerCase();
    const mt = mimeType.toLowerCase();

    if (mt.startsWith('image/') || fn.match(/\.(png|jpg|jpeg|webp|gif|bmp)$/)) {
        return 'image';
    }
    if (mt.startsWith('video/') || fn.match(/\.(mp4|webm|mkv|mov|avi)$/)) {
        return 'video';
    }
    if (mt.includes('pdf') || fn.endsWith('.pdf')) {
        return 'pdf';
    }
    return 'text';
};

/**
 * Extract plain text from an evidence file buffer based on MIME type or filename.
 */
const extractTextFromBuffer = async (buffer, mimeType, fileName = '') => {
    try {
        if (!buffer || buffer.length === 0) return '';

        const mediaType = getMediaType(mimeType, fileName);

        if (mediaType === 'pdf') {
            const data = await pdfParse(buffer);
            return data.text || '';
        }

        if (mediaType === 'image') {
            return `[IMAGE EVIDENCE FILE: ${fileName} | Size: ${buffer.length} bytes | Format: ${mimeType || 'Image'}]`;
        }

        if (mediaType === 'video') {
            return `[VIDEO EVIDENCE FILE: ${fileName} | Size: ${buffer.length} bytes | Format: ${mimeType || 'Video'}]`;
        }

        // Default: treat as text / json / log / markdown
        return buffer.toString('utf-8');
    } catch (err) {
        console.error(`Error parsing document text (${fileName}):`, err.message);
        return buffer.toString('utf-8'); // Fallback to raw string
    }
};

/**
 * Chunk text into overlapping segments for RAG retrieval.
 * @param {string} text Full document text
 * @param {number} chunkSize Maximum characters per chunk (default 500)
 * @param {number} overlap Overlap between consecutive chunks (default 100)
 */
const chunkText = (text, chunkSize = 500, overlap = 100) => {
    if (!text || typeof text !== 'string') return [];
    
    // Normalize whitespace
    const cleanText = text.replace(/\r\n/g, '\n').trim();
    if (cleanText.length <= chunkSize) {
        return [{
            id: `chunk-0-${crypto.randomBytes(4).toString('hex')}`,
            text: cleanText,
            startIdx: 0,
            endIdx: cleanText.length
        }];
    }

    const chunks = [];
    let start = 0;
    let chunkIndex = 0;

    while (start < cleanText.length) {
        const end = Math.min(start + chunkSize, cleanText.length);
        const chunkTextStr = cleanText.substring(start, end);

        chunks.push({
            id: `chunk-${chunkIndex}-${crypto.randomBytes(4).toString('hex')}`,
            text: chunkTextStr,
            startIdx: start,
            endIdx: end
        });

        chunkIndex++;
        start += (chunkSize - overlap);
    }

    return chunks;
};

/**
 * Calculate Term Frequency (TF) vector representation of a string.
 */
const getTFVector = (text) => {
    const words = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    const freq = {};
    for (const w of words) {
        freq[w] = (freq[w] || 0) + 1;
    }
    return freq;
};

/**
 * Calculate Cosine Similarity between two TF vectors.
 */
const cosineSimilarity = (vecA, vecB) => {
    const keysA = Object.keys(vecA);
    const keysB = Object.keys(vecB);
    if (keysA.length === 0 || keysB.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const key of keysA) {
        normA += vecA[key] * vecA[key];
        if (vecB[key]) {
            dotProduct += vecA[key] * vecB[key];
        }
    }

    for (const key of keysB) {
        normB += vecB[key] * vecB[key];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Retrieve Top-K matching evidence chunks for a query across evidence items.
 * @param {string} query Search query string
 * @param {Array} evidenceItems List of evidence records (with fileName, fileHash, description, text)
 * @param {number} topK Number of top chunks to return (default 4)
 */
const retrieveRelevantChunks = (query, evidenceItems, topK = 4) => {
    const queryVector = getTFVector(query);
    const allScoredChunks = [];

    for (const item of evidenceItems) {
        const textContent = item.textContent || item.description || item.fileName || '';
        const chunks = chunkText(textContent);

        const isMedia = item.fileName && item.fileName.match(/\.(png|jpg|jpeg|webp|gif|mp4|webm|mkv)$/i);

        for (const chunk of chunks) {
            const chunkVector = getTFVector(chunk.text);
            let score = cosineSimilarity(queryVector, chunkVector);

            // Give baseline relevance to media files so Gemini Vision AI receives them
            if (isMedia && score < 0.5) {
                score = 0.75;
            }

            allScoredChunks.push({
                evidenceId: item._id,
                fileName: item.fileName,
                fileHash: item.fileHash,
                uploader: item.uploader,
                chunkId: chunk.id,
                chunkText: chunk.text,
                mediaPart: item.mediaPart || null,
                score: Math.round(score * 100) / 100
            });
        }
    }

    // Sort descending by similarity score
    allScoredChunks.sort((a, b) => b.score - a.score);

    // Return top-K or all if fewer
    return allScoredChunks.slice(0, topK);
};

module.exports = {
    extractTextFromBuffer,
    chunkText,
    retrieveRelevantChunks,
    cosineSimilarity
};
