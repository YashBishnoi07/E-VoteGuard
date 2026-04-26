/**
 * Hashing Engine — SHA-256 Based Duplicate Detection
 * Algorithm: Hash Table (O(1) average lookup, O(n) space)
 * 
 * Core DAA Concept: Hashing for fast duplicate detection
 * Time Complexity: O(1) average for lookup, O(n) for building the set
 * Space Complexity: O(n) where n = number of voters
 */
const crypto = require('crypto');

/**
 * Generate a unique SHA-256 fingerprint for a voter
 * Combines VoterID + Email + system SALT to prevent rainbow table attacks
 */
function generateVoterHash(voterID, email) {
  const salt = process.env.SALT || 'evoting_default_salt';
  return crypto.createHash('sha256')
    .update(voterID + email + salt)
    .digest('hex');
}

/**
 * Generate a SHA-256 vote receipt hash
 * Combines voterHash + candidateId + timestamp + nonce for uniqueness
 */
function generateVoteReceipt(voterHash, candidateId, timestamp) {
  const nonce = crypto.randomBytes(16).toString('hex');
  return crypto.createHash('sha256')
    .update(voterHash + String(candidateId) + String(timestamp) + nonce)
    .digest('hex');
}

/**
 * Check for duplicate vote using O(1) hash set lookup
 * @param {string} voterHash - SHA-256 hash of voter identity
 * @param {Set} votedHashSet - In-memory hash set of all voted hashes
 * @returns {boolean} true if duplicate detected
 */
function checkDuplicateVote(voterHash, votedHashSet) {
  return votedHashSet.has(voterHash); // O(1) average
}

/**
 * Build a hash set from existing vote records
 * O(n) time to build, O(n) space
 */
function buildVotedHashSet(votes) {
  const set = new Set();
  for (const vote of votes) {
    set.add(vote.voterHash);
  }
  return set;
}

/**
 * Generate device fingerprint from request metadata
 */
function generateDeviceFingerprint(req) {
  const ua = req.headers['user-agent'] || 'unknown';
  const acceptLang = req.headers['accept-language'] || 'unknown';
  const ip = req.ip || req.connection.remoteAddress || '0.0.0.0';
  return crypto.createHash('sha256')
    .update(ua + acceptLang + ip)
    .digest('hex')
    .substring(0, 32);
}

module.exports = {
  generateVoterHash,
  generateVoteReceipt,
  checkDuplicateVote,
  buildVotedHashSet,
  generateDeviceFingerprint,
  COMPLEXITY: {
    name: 'SHA-256 Hash Table',
    purpose: 'Duplicate voter & vote detection',
    time: 'O(1) lookup average',
    space: 'O(n) for hash set',
    worstCase: 'O(n) with hash collisions',
    implementation: 'SHA-256 via Node.js crypto + Set data structure'
  }
};
