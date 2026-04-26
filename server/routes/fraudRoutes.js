const express = require('express');
const router = express.Router();
const {
  getFraudLogs, getFlaggedVoters, getFraudScore,
  blockVoter, getFraudClusters, getFraudDistribution,
  getStateStats
} = require('../controllers/fraudController');
const { adminMiddleware, authMiddleware } = require('../middleware/authMiddleware');

router.get('/logs', adminMiddleware, getFraudLogs);
router.get('/flagged', adminMiddleware, getFlaggedVoters);
router.get('/score/:voterId', adminMiddleware, getFraudScore);
router.post('/block/:voterId', adminMiddleware, blockVoter);
router.get('/clusters', adminMiddleware, getFraudClusters);
router.get('/distribution', adminMiddleware, getFraudDistribution);
router.get('/state-stats', adminMiddleware, getStateStats);

module.exports = router;
