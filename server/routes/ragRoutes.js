const express = require('express');
const router = express.Router();
const { 
    queryCaseEvidence, 
    investigateCase, 
    generateCaseReport 
} = require('../controllers/ragController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/query', protect, queryCaseEvidence);
router.get('/case/:caseId/investigate', protect, investigateCase);
router.post('/case/:caseId/report', protect, generateCaseReport);

module.exports = router;
