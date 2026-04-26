const express = require('express');
const router = express.Router();
const { castVote, getResults, verifyVote, getLedger, CANDIDATES } = require('../controllers/voteController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { voteLimiter } = require('../middleware/rateLimiter');

router.post('/cast', authMiddleware, voteLimiter, castVote);
router.get('/results', getResults);
router.get('/ledger', adminMiddleware, getLedger);
router.get('/verify/:hash', verifyVote);
router.get('/candidates', (req, res) => res.json({ candidates: CANDIDATES }));

module.exports = router;
