const Voter = require('../models/Voter');
const Vote = require('../models/Vote');
const FraudLog = require('../models/FraudLog');
const crypto = require('crypto');
const { generateDeviceFingerprint } = require('../algorithms/hashingEngine');
const { quickFraudAssessment, extractVoterBehavior } = require('../algorithms/greedyValidator');

const CANDIDATES = [
  { id: 1, name: 'Arjun Sharma', party: 'Progressive Alliance', color: '#FF6B00' },
  { id: 2, name: 'Priya Menon', party: "People's Front", color: '#00A86B' },
  { id: 3, name: 'Ravi Kumar', party: 'Unity Party', color: '#D4AF37' },
  { id: 4, name: 'Sneha Patel', party: 'Reform Coalition', color: '#3B82F6' }
];

const castVote = async (req, res) => {
  const start = Date.now();
  try {
    const { candidateId, votingTimeSec } = req.body;
    const voter = req.user;

    // Validate Candidate
    const candidate = CANDIDATES.find(c => c.id === parseInt(candidateId));
    if (!candidate) return res.status(400).json({ message: 'Invalid Candidate' });

    // Double Vote Check
    if (voter.hasVoted) return res.status(403).json({ message: 'Already Voted' });

    // Fraud Assessment
    const behavior = extractVoterBehavior(req, voter, (votingTimeSec || 5) * 1000);
    const fraud = quickFraudAssessment(behavior);

    // Blockchain Chain Logic
    const lastBlock = await Vote.findOne().sort({ blockIndex: -1 }).lean();
    const prevHash = lastBlock?.receiptHash || "0000000000000000000000000000000000000000000000000000000000000000";
    const blockIndex = (lastBlock?.blockIndex + 1) || 0;
    const ts = Date.now();

    // Hashing
    const dataToHash = `${prevHash}|${voter.voterID}|${candidateId}|${ts}`;
    const receiptHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

    const vote = new Vote({
      voterHash: voter.hashedFingerprint || `GEN_${ts}`,
      voterID: voter.voterID,
      candidateId: candidate.id,
      candidateName: candidate.name,
      ipAddress: req.ip || '127.0.0.1',
      deviceFingerprint: generateDeviceFingerprint(req),
      receiptHash,
      prevHash,
      blockIndex,
      processingTimeMs: Date.now() - start,
      voterState: voter.state,
      castByName: voter.name
    });

    await vote.save();

    await Voter.findByIdAndUpdate(voter._id, {
      hasVoted: true,
      voteReceiptHash: receiptHash,
      riskLevel: fraud.risk
    });

    // Notify Dashboard
    const io = req.app.get('socketio');
    if (io) io.emit('vote:cast', { receiptHash, blockIndex, candidateName: candidate.name });

    res.status(201).json({ message: 'Vote Cast Successfully', receiptHash });

  } catch (err) {
    console.error("VOTE_ERROR:", err);
    res.status(500).json({ message: 'Server error during voting', error: err.message });
  }
};

const getResults = async (req, res) => {
  const total = await Vote.countDocuments();
  const candidates = await Promise.all(CANDIDATES.map(async c => ({
    ...c,
    votes: await Vote.countDocuments({ candidateId: c.id })
  })));
  res.json({ candidates, total });
};

const getLedger = async (req, res) => {
  const ledger = await Vote.find().sort({ blockIndex: -1 }).limit(20);
  res.json({ ledger });
};

const verifyVote = async (req, res) => {
  const vote = await Vote.findOne({ receiptHash: req.params.hash });
  res.json({ verified: !!vote, vote });
};

module.exports = { castVote, getResults, verifyVote, getLedger, CANDIDATES };
