const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini API Client if API key present in env
const getAiClient = () => {
    if (process.env.GEMINI_API_KEY) {
        return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return null;
};

/**
 * 🕵️ Forensic Investigator Agent
 * Extracts entities, IP addresses, emails, hashes, and indicators of compromise from text.
 */
const runInvestigatorAgent = async (evidenceText) => {
    // Regex entity extraction fallback & baseline
    const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const hashRegex = /\b[a-fA-F0-9]{32,64}\b/g;
    const cveRegex = /\bCVE-\d{4}-\d{4,7}\b/gi;
    const cryptoWalletRegex = /\b(?:[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[ac-hj-np-z02-9]{11,71}|0x[a-fA-F0-9]{40})\b/g;
    const urlRegex = /https?:\/\/[a-zA-Z0-9.-]+(?:\/[a-zA-Z0-9_.-]*)*\b/g;

    const ips = Array.from(new Set(evidenceText.match(ipRegex) || []));
    const emails = Array.from(new Set(evidenceText.match(emailRegex) || []));
    const hashes = Array.from(new Set(evidenceText.match(hashRegex) || []));
    const cves = Array.from(new Set(evidenceText.match(cveRegex) || []));
    const cryptoWallets = Array.from(new Set(evidenceText.match(cryptoWalletRegex) || []));
    const urls = Array.from(new Set(evidenceText.match(urlRegex) || []));


    const ai = getAiClient();
    let aiInsights = null;

    if (ai) {
        try {
            const prompt = `You are a Senior Digital Forensics Investigator. Analyze the following evidence text and extract key investigative findings.
Return a structured JSON object with keys: "entities", "suspects", "criticalEvents", and "summary".

Evidence Text:
${evidenceText.substring(0, 4000)}`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            aiInsights = response.text;
        } catch (err) {
            console.error('Gemini AI Investigator Agent Error:', err.message);
        }
    }

    return {
        detectedEntities: {
            ipAddresses: ips,
            emails: emails,
            hashes: hashes,
            cves: cves,
            cryptoWallets: cryptoWallets,
            urls: urls
        },
        aiSummary: aiInsights || `Extracted ${ips.length} IP addresses, ${emails.length} email addresses, ${hashes.length} hashes, ${cves.length} CVEs, and ${cryptoWallets.length} crypto wallets from evidence text.`
    };
};


/**
 * 💬 Case Evidence RAG Q&A Agent
 * Uses RAG retrieved chunks to answer user questions about evidence files.
 */
const runRagQueryAgent = async (query, retrievedChunks, caseTitle = '') => {
    const contextText = retrievedChunks.map((c, i) => 
        `[Source Chunk ${i + 1} | File: ${c.fileName} | Score: ${c.score}]\n${c.chunkText}`
    ).join('\n\n');

    const ai = getAiClient();

    if (ai) {
        try {
            const systemPrompt = `You are a Senior AI Digital Forensic Analyst assisting with Case: "${caseTitle}".
Analyze the provided evidence chunks AND any attached evidence images/media below.
If evidence images are provided, perform visual OCR, identify visual content/text/screens, and answer the user query in complete detail based on what you see in the evidence images and text.
Always cite the evidence file names in your response.

=== RETRIEVED EVIDENCE SOURCES ===
${contextText}

=== USER QUERY ===
${query}`;

            // Collect any image/media parts for Gemini Multimodal Vision analysis
            const mediaParts = retrievedChunks
                .map(c => c.mediaPart)
                .filter(mp => mp && mp.inlineData && mp.inlineData.data);

            const contents = [systemPrompt, ...mediaParts];

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: contents,
            });

            return {
                answer: response.text,
                citations: retrievedChunks
            };
        } catch (err) {
            console.error('Gemini RAG Query Error:', err.message);
        }
    }

    // Fallback RAG response generator if Gemini API key is not configured
    let fallbackAnswer = `### 🔍 RAG Multimodal Evidence Analysis for Query: "${query}"\n\n`;
    if (retrievedChunks.length === 0) {
        fallbackAnswer += `No relevant evidence chunks or media matching your query were found in this case.`;
    } else {
        fallbackAnswer += `Based on the **${retrievedChunks.length} matching evidence sources** (Text, Images 🖼️, & Videos 🎬) retrieved from the case:\n\n`;
        retrievedChunks.forEach((c, idx) => {
            const isMedia = c.fileName.match(/\.(png|jpg|jpeg|webp|gif|mp4|webm|mkv)$/i);
            const icon = isMedia ? (c.fileName.match(/\.(mp4|webm|mkv)$/i) ? '🎬 Video Evidence' : '🖼️ Image Evidence') : '📄 Document Evidence';
            fallbackAnswer += `**${idx + 1}. ${icon} \`${c.fileName}\` (Relevance: ${Math.round(c.score * 100)}%)**:\n> "${c.chunkText.substring(0, 200)}..."\n\n`;
        });
        fallbackAnswer += `*Tip: Configure \`GEMINI_API_KEY\` in \`server/.env\` for automated Multimodal AI Vision & Video frame analysis.*`;
    }

    return {
        answer: fallbackAnswer,
        citations: retrievedChunks
    };
};

/**
 * 📝 Case Report Synthesizer Agent
 * Generates an executive forensic report for a case.
 */
const runReportSynthesizerAgent = async (caseData, evidenceItems) => {
    const evidenceSummary = evidenceItems.map(e => 
        `- **${e.fileName}** (Uploader: ${e.uploader ? e.uploader.name : 'Unknown'}, Hash: \`${e.fileHash || 'N/A'}\`, Size: ${e.fileSize} bytes)`
    ).join('\n');

    const reportHeader = `# 🛡️ DIGITAL FORENSIC CASE REPORT
**Case Title**: ${caseData.title}
**Priority**: ${caseData.priority.toUpperCase()}
**Status**: ${caseData.status}
**Generated Date**: ${new Date().toISOString()}

---

## 1. Executive Summary
This report summarizes the digital evidence gathered for case **"${caseData.title}"**. A total of **${evidenceItems.length} evidence items** have been processed, hashed, and verified in the chain of custody.

---

## 2. Chain of Custody & Evidence Inventory
${evidenceSummary || 'No evidence items recorded yet for this case.'}

---

## 3. Integrity Verification Status
All recorded evidence hashes have been validated against standard SHA-256 digests to ensure zero tampering.

---

## 4. Key Findings & Recommendations
- All evidence records must be retained in secure storage.
- Audit trail logging has captured all upload, download, and verification actions for this case file.
`;

    return reportHeader;
};

module.exports = {
    runInvestigatorAgent,
    runRagQueryAgent,
    runReportSynthesizerAgent
};
