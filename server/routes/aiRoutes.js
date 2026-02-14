const express = require('express');
const router = express.Router();
const { aiSearch, getSimilarCases, regenerateEmbedding } = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');

// All routes require authentication
router.post('/search', protect, aiSearch);
router.get('/similar/:caseId', protect, getSimilarCases);
router.post('/regenerate/:caseId', protect, regenerateEmbedding);

module.exports = router;
