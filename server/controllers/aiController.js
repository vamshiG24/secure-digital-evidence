const { smartSearch, findSimilarCases, updateCaseEmbedding } = require('../services/aiService');

/**
 * @desc    Smart AI search across cases
 * @route   POST /api/ai/search
 * @access  Private
 */
exports.aiSearch = async (req, res) => {
    try {
        const { query, limit = 10 } = req.body;

        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const results = await smartSearch(query, parseInt(limit));

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error('AI Search Error:', error);
        res.status(500).json({
            message: 'AI search failed',
            error: error.message
        });
    }
};

/**
 * @desc    Find similar cases
 * @route   GET /api/ai/similar/:caseId
 * @access  Private
 */
exports.getSimilarCases = async (req, res) => {
    try {
        const { caseId } = req.params;
        const { limit = 5 } = req.query;

        const similarCases = await findSimilarCases(caseId, parseInt(limit));

        res.json({
            success: true,
            count: similarCases.length,
            data: similarCases
        });
    } catch (error) {
        console.error('Similar Cases Error:', error);
        res.status(500).json({
            message: 'Failed to find similar cases',
            error: error.message
        });
    }
};

/**
 * @desc    Regenerate embedding for a case
 * @route   POST /api/ai/regenerate/:caseId
 * @access  Private (Admin only)
 */
exports.regenerateEmbedding = async (req, res) => {
    try {
        const { caseId } = req.params;

        await updateCaseEmbedding(caseId);

        res.json({
            success: true,
            message: 'Embedding regenerated successfully'
        });
    } catch (error) {
        console.error('Regenerate Embedding Error:', error);
        res.status(500).json({
            message: 'Failed to regenerate embedding',
            error: error.message
        });
    }
};
