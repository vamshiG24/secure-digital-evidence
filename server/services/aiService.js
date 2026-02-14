const OpenAI = require('openai');
const Case = require('../models/Case');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate embedding for text using OpenAI
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<number[]>} - Embedding vector
 */
const generateEmbedding = async (text) => {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw new Error('Failed to generate embedding');
    }
};

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} - Similarity score (0-1)
 */
const cosineSimilarity = (vecA, vecB) => {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
};

/**
 * Find similar cases based on embeddings
 * @param {string} caseId - Case ID to find similar cases for
 * @param {number} limit - Number of similar cases to return
 * @returns {Promise<Array>} - Array of similar cases with similarity scores
 */
const findSimilarCases = async (caseId, limit = 5) => {
    try {
        // Get the target case with embedding
        const targetCase = await Case.findById(caseId).select('+embedding');

        if (!targetCase || !targetCase.embedding) {
            throw new Error('Case not found or embedding not available');
        }

        // Get all other cases with embeddings
        const allCases = await Case.find({
            _id: { $ne: caseId },
            embedding: { $exists: true, $ne: null }
        }).select('+embedding').populate('assignedTo', 'name email').populate('createdBy', 'name email');

        // Calculate similarity scores
        const casesWithScores = allCases.map(caseItem => ({
            case: caseItem,
            similarity: cosineSimilarity(targetCase.embedding, caseItem.embedding)
        }));

        // Sort by similarity and return top results
        return casesWithScores
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)
            .map(item => ({
                ...item.case.toObject(),
                similarityScore: (item.similarity * 100).toFixed(2)
            }));
    } catch (error) {
        console.error('Error finding similar cases:', error);
        throw error;
    }
};

/**
 * Smart search using AI embeddings
 * @param {string} query - Search query
 * @param {number} limit - Number of results to return
 * @returns {Promise<Array>} - Array of matching cases
 */
const smartSearch = async (query, limit = 10) => {
    try {
        // Generate embedding for search query
        const queryEmbedding = await generateEmbedding(query);

        // Get all cases with embeddings
        const allCases = await Case.find({
            embedding: { $exists: true, $ne: null }
        }).select('+embedding').populate('assignedTo', 'name email').populate('createdBy', 'name email');

        // Calculate similarity scores
        const casesWithScores = allCases.map(caseItem => ({
            case: caseItem,
            relevance: cosineSimilarity(queryEmbedding, caseItem.embedding)
        }));

        // Sort by relevance and return top results
        return casesWithScores
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, limit)
            .filter(item => item.relevance > 0.3) // Filter out low relevance results
            .map(item => ({
                ...item.case.toObject(),
                relevanceScore: (item.relevance * 100).toFixed(2)
            }));
    } catch (error) {
        console.error('Error in smart search:', error);
        throw error;
    }
};

/**
 * Generate and update embedding for a case
 * @param {string} caseId - Case ID
 * @returns {Promise<void>}
 */
const updateCaseEmbedding = async (caseId) => {
    try {
        const caseItem = await Case.findById(caseId);
        if (!caseItem) {
            throw new Error('Case not found');
        }

        // Combine title and description for embedding
        const textToEmbed = `${caseItem.title}. ${caseItem.description}`;
        const embedding = await generateEmbedding(textToEmbed);

        // Update case with embedding
        caseItem.embedding = embedding;
        await caseItem.save();
    } catch (error) {
        console.error('Error updating case embedding:', error);
        throw error;
    }
};

module.exports = {
    generateEmbedding,
    findSimilarCases,
    smartSearch,
    updateCaseEmbedding,
    cosineSimilarity
};
