const express = require('express');
const router = express.Router();
const { getVoterIDScan, getStateStats, getAuditLogs, getStats, deleteVoter, getAllVoters } = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

router.get('/stats', authMiddleware, adminMiddleware, getStats);
router.get('/voters', authMiddleware, adminMiddleware, getAllVoters);
router.get('/voter-id-scan', authMiddleware, adminMiddleware, getVoterIDScan);
router.get('/state-stats', authMiddleware, adminMiddleware, getStateStats);
router.get('/audit', authMiddleware, adminMiddleware, getAuditLogs);
router.delete('/voters/:id', authMiddleware, adminMiddleware, deleteVoter);

module.exports = router;
