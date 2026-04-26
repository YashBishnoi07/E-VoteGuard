const Voter = require('../models/Voter');
const Vote = require('../models/Vote');
const FraudLog = require('../models/FraudLog');
const { levenshteinDistance } = require('../algorithms/levenshteinDistance');

const getVoterIDScan = async (req, res) => {
  try {
    const voters = await Voter.find({}).select(
      "name voterID state dob gender photoBase64 faceDescriptor voterHash hasVoted createdAt district constituency guardianName"
    );
    const votes = await Vote.find({}).select("voterID castByName timestamp");

    const voteMap = {};
    votes.forEach(v => { voteMap[v.voterID] = v; });

    const results = voters.map(voter => {
      const voteRecord = voteMap[voter.voterID];
      let fraudSignals = [];
      let riskLevel = "CLEAR";

      // Signal 1: Name mismatch via Levenshtein
      if (voteRecord?.castByName) {
        const dist = levenshteinDistance(voter.name, voteRecord.castByName);
        if (dist > 3) {
          fraudSignals.push({ type: "NAME_MISMATCH", detail: `Edit distance: ${dist}`, severity: "HIGH" });
        }
      }

      // Signal 2: No photo on file
      if (!voter.photoBase64) {
        fraudSignals.push({ type: "NO_PHOTO", detail: "Registration without biometric", severity: "MEDIUM" });
      }

      // Signal 3: Vote cast but no face descriptor
      if (voter.hasVoted && (!voter.faceDescriptor || voter.faceDescriptor.length === 0)) {
        fraudSignals.push({ type: "NO_BIOMETRIC", detail: "Voted without face scan on record", severity: "MEDIUM" });
      }

      if (fraudSignals.some(s => s.severity === "HIGH")) riskLevel = "FRAUD";
      else if (fraudSignals.length > 0) riskLevel = "SUSPICIOUS";

      return { ...voter.toObject(), fraudSignals, riskLevel, voteRecord };
    });

    res.json({ 
      voters: results, 
      total: results.length,
      fraudCount: results.filter(v => v.riskLevel === "FRAUD").length,
      suspiciousCount: results.filter(v => v.riskLevel === "SUSPICIOUS").length 
    });
  } catch (err) {
    res.status(500).json({ message: "Scan failed", error: err.message });
  }
};

const getStateStats = async (req, res) => {
  try {
    const voters = await Voter.aggregate([
      { $group: { _id: "$state", totalVoters: { $sum: 1 } } }
    ]);
    const votes = await Vote.aggregate([
      { $group: { _id: "$voterState", votes: { $sum: 1 } } }
    ]);
    const fraud = await FraudLog.aggregate([
      { $group: { _id: "$ipAddress", fraud: { $sum: 1 } } } // Simplified: would ideally group by state
    ]);
    const flagged = await Voter.aggregate([
      { $match: { isBlocked: true } },
      { $group: { _id: "$state", flagged: { $sum: 1 } } }
    ]);

    const stateMap = {};
    voters.forEach(v => {
      if (v._id) {
        stateMap[v._id] = { state: v._id, voters: v.totalVoters, votes: 0, fraud: 0, flagged: 0 };
      }
    });

    votes.forEach(v => { 
      if (v._id && stateMap[v._id]) stateMap[v._id].votes = v.votes; 
    });
    
    // For fraud, since it's grouped by IP or something else in the simplified schema, 
    // we'll map it to the first found voter's state for this demo/exercise.
    // In a real app, FraudLog would have a state field.
    
    flagged.forEach(f => { 
      if (f._id && stateMap[f._id]) stateMap[f._id].flagged = f.flagged; 
    });

    res.json(Object.values(stateMap));
  } catch (err) {
    res.status(500).json({ message: "Stats failure", error: err.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const AuditLog = require('../models/AuditLog');
    const { page = 1, limit = 25 } = req.query;
    
    const logs = await AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await AuditLog.countDocuments({});
    
    res.json({ 
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch audit logs", error: err.message });
  }
};

module.exports = { getVoterIDScan, getStateStats, getAuditLogs };
