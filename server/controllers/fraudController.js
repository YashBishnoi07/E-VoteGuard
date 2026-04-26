const Voter = require('../models/Voter');
const Vote = require('../models/Vote');
const FraudLog = require('../models/FraudLog');
const AuditLog = require('../models/AuditLog');
const { detectFraudClusters } = require('../algorithms/graphFraudDetector');
const { detectBurstVoting, analyzeVoteFrequency } = require('../algorithms/patternDetection');
const { calculateFraudScore } = require('../algorithms/greedyValidator');
const { computeBehavioralRiskScore } = require('../algorithms/anomalyScoring');
const { COMPLEXITY: hashComplexity } = require('../algorithms/hashingEngine');
const { COMPLEXITY: patternComplexity } = require('../algorithms/patternDetection');
const { COMPLEXITY: graphComplexity } = require('../algorithms/graphFraudDetector');
const { COMPLEXITY: greedyComplexity } = require('../algorithms/greedyValidator');
const { COMPLEXITY: dpComplexity } = require('../algorithms/anomalyScoring');

/**
 * GET /api/fraud/logs
 * All fraud events (admin only)
 */
const getFraudLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, riskLevel, fraudType } = req.query;
    const filter = {};
    if (riskLevel) filter.riskLevel = riskLevel;
    if (fraudType) filter.fraudType = fraudType;

    const logs = await FraudLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await FraudLog.countDocuments(filter);

    res.json({
      logs,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching fraud logs.', error: err.message });
  }
};

/**
 * GET /api/fraud/flagged
 * List of flagged voters and all registered assets (admin only)
 */
const getFlaggedVoters = async (req, res) => {
  try {
    // Return only flagged or blocked voters
    const flaggedVoters = await Voter.find({
        $or: [{ fraudScore: { $gt: 0 } }, { isBlocked: true }]
      })
      .select('-password -__v')
      .sort({ fraudScore: -1, createdAt: -1 });

    res.json({ flaggedVoters, total: flaggedVoters.length });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching voters.', error: err.message });
  }
};

/**
 * GET /api/fraud/score/:voterId
 * Get fraud score for a specific voter (admin)
 */
const getFraudScore = async (req, res) => {
  try {
    const { voterId } = req.params;
    const voter = await Voter.findOne({ voterID: voterId }).select('-password');

    if (!voter) {
      return res.status(404).json({ message: 'Voter not found.' });
    }

    // Compute behavioral risk using DP
    const behavioralRisk = computeBehavioralRiskScore(voter.actionLog || []);

    // Get fraud logs for this voter
    const fraudLogs = await FraudLog.find({ voterID: voterId }).sort({ createdAt: -1 });

    res.json({
      voter: {
        voterID: voter.voterID,
        name: voter.name,
        email: voter.email,
        state: voter.state,
        fraudScore: voter.fraudScore,
        riskLevel: voter.riskLevel,
        isBlocked: voter.isBlocked,
        hasVoted: voter.hasVoted,
        loginAttempts: voter.loginAttempts
      },
      behavioralRisk,
      fraudLogs,
      algorithm: 'DP Behavioral Analysis: O(n) + O(n²) pattern scan'
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching fraud score.', error: err.message });
  }
};

/**
 * POST /api/fraud/block/:voterId
 * Block a voter (admin action)
 */
const blockVoter = async (req, res) => {
  try {
    const { voterId } = req.params;
    const { reason } = req.body;
    const admin = req.user;

    const voter = await Voter.findOne({ voterID: voterId });
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found.' });
    }

    const wasBlocked = voter.isBlocked;
    voter.isBlocked = !wasBlocked; // toggle
    await voter.save();

    const action = wasBlocked ? 'VOTER_UNBLOCKED' : 'VOTER_BLOCKED';

    await AuditLog.create({
      action,
      actor: admin.voterID,
      actorName: admin.name,
      target: voterId,
      description: `Admin ${admin.name} ${wasBlocked ? 'unblocked' : 'blocked'} voter ${voter.name}. Reason: ${reason || 'Admin action'}`,
      severity: wasBlocked ? 'INFO' : 'CRITICAL'
    });

    if (!wasBlocked) {
      await FraudLog.create({
        voterID: voter.voterID,
        voterName: voter.name,
        fraudType: 'SUSPICIOUS_BEHAVIOR',
        score: 100,
        riskLevel: 'HIGH',
        reason: reason || 'Manually blocked by admin',
        actionTaken: 'BLOCKED'
      });
    }

    // Socket.IO broadcast
    const io = req.app.get('socketio');
    if (io) {
      io.emit('voter:blocked', {
        voterID: voterId,
        name: voter.name,
        action: wasBlocked ? 'UNBLOCKED' : 'BLOCKED',
        reason
      });
    }

    res.json({
      message: `Voter ${wasBlocked ? 'unblocked' : 'blocked'} successfully`,
      voter: { voterID: voter.voterID, name: voter.name, isBlocked: voter.isBlocked }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error blocking voter.', error: err.message });
  }
};

/**
 * GET /api/fraud/clusters
 * Graph-based fraud cluster detection (admin)
 */
const getFraudClusters = async (req, res) => {
  try {
    const votes = await Vote.find({}).select('voterID ipAddress deviceFingerprint timestamp');

    const clusterData = detectFraudClusters(votes);

    res.json({
      ...clusterData,
      algorithm: 'BFS Graph Traversal: O(V + E)',
      clusterThreshold: 3
    });
  } catch (err) {
    res.status(500).json({ message: 'Error detecting fraud clusters.', error: err.message });
  }
};

/**
 * GET /api/fraud/distribution
 * Fraud type distribution for pie chart
 */
const getFraudDistribution = async (req, res) => {
  try {
    const distribution = await FraudLog.aggregate([
      { $group: { _id: '$fraudType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({ distribution });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching distribution.', error: err.message });
  }
};

/**
 * GET /api/fraud/state-stats
 * Aggregate votes and fraud by state for India Map
 */
const getStateStats = async (req, res) => {
  try {
    const voterStats = await Voter.aggregate([
      {
        $group: {
          _id: '$state',
          registeredCount: { $sum: 1 },
          voteCount: { $sum: { $cond: ['$hasVoted', 1, 0] } },
          flaggedCount: { 
            $sum: { 
              $cond: [
                { $or: [{ $eq: ['$riskLevel', 'HIGH'] }, { $eq: ['$riskLevel', 'MEDIUM'] }] }, 
                1, 0 
              ] 
            } 
          }
        }
      }
    ]);

    const fraudStats = await FraudLog.aggregate([
      { $group: { _id: '$state', fraudCount: { $sum: 1 } } }
    ]);

    // Format for frontend
    const stats = voterStats.map(v => ({
      state: v._id,
      registered: v.registeredCount,
      votes: v.voteCount,
      flagged: v.flaggedCount,
      fraud: (fraudStats.find(f => f._id === v._id) || { fraudCount: 0 }).fraudCount
    }));

    res.json({ stats });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching state stats.', error: err.message });
  }
};

module.exports = {
  getFraudLogs,
  getFlaggedVoters,
  getFraudScore,
  blockVoter,
  getFraudClusters,
  getFraudDistribution,
  getStateStats
};
