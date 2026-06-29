/**
 * Greedy Real-Time Fraud Scoring Engine
 * Algorithm: Greedy Algorithm with weighted signal accumulation
 * 
 * Core DAA Concept: Greedy strategy — locally optimal decisions per signal
 * Time Complexity: O(k) where k = number of fraud signals (constant)
 * Space Complexity: O(1) — no extra memory beyond input signals
 * 
 * Strategy: Greedily accumulate fraud score from multiple behavioral signals.
 * Each signal contributes a weight; we take the maximum local benefit at each step.
 */

// Fraud signal weights (greedy weights)
const FRAUD_WEIGHTS = {
  UNKNOWN_IP: 30,           // Voting from new/unrecognized IP
  TOO_FAST_VOTE: 25,        // Vote submitted in < 5 seconds
  DEVICE_MISMATCH: 20,      // Device fingerprint doesn't match registered
  UNUSUAL_LOCATION: 15,     // IP geolocation doesn't match registered state
  FAILED_LOGINS: 10,        // Multiple failed login attempts
  ODD_HOUR_VOTE: 8,         // Voting between 2AM - 5AM
  SUSPICIOUS_UA: 7,         // Headless browser or suspicious user agent
  RAPID_REQUESTS: 5,        // High frequency API requests
};

// Thresholds
const HIGH_RISK_THRESHOLD = 60;
const MEDIUM_RISK_THRESHOLD = 40;
const FAST_VOTE_SECONDS = 5;
const MAX_FAILED_LOGINS = 3;

/**
 * Calculate fraud score using greedy weighted accumulation
 * Makes locally optimal (greedy) decision for each signal
 * T(n) = O(k) where k = number of signals = constant
 */
function calculateFraudScore(voterBehavior) {
  let score = 0;
  const triggeredSignals = [];
  const details = {};

  // Signal 1: Unknown/new IP address
  if (voterBehavior.unknownIP) {
    score += FRAUD_WEIGHTS.UNKNOWN_IP;
    triggeredSignals.push('UNKNOWN_IP');
    details.unknownIP = `New IP detected. +${FRAUD_WEIGHTS.UNKNOWN_IP} points`;
  }

  // Signal 2: Suspiciously fast vote (bot indicator)
  if (voterBehavior.votingTimeSec !== undefined && voterBehavior.votingTimeSec < FAST_VOTE_SECONDS) {
    score += FRAUD_WEIGHTS.TOO_FAST_VOTE;
    triggeredSignals.push('TOO_FAST_VOTE');
    details.tooFast = `Vote cast in ${voterBehavior.votingTimeSec}s (< ${FAST_VOTE_SECONDS}s threshold). +${FRAUD_WEIGHTS.TOO_FAST_VOTE} points`;
  }

  // Signal 3: Device fingerprint mismatch
  if (voterBehavior.deviceMismatch) {
    score += FRAUD_WEIGHTS.DEVICE_MISMATCH;
    triggeredSignals.push('DEVICE_MISMATCH');
    details.deviceMismatch = `Device fingerprint changed. +${FRAUD_WEIGHTS.DEVICE_MISMATCH} points`;
  }

  // Signal 4: Geographic/location anomaly
  if (voterBehavior.locationAnomaly) {
    score += FRAUD_WEIGHTS.UNUSUAL_LOCATION;
    triggeredSignals.push('UNUSUAL_LOCATION');
    details.locationAnomaly = `Vote from unexpected region. +${FRAUD_WEIGHTS.UNUSUAL_LOCATION} points`;
  }

  // Signal 5: Multiple failed login attempts
  if (voterBehavior.failedLogins && voterBehavior.failedLogins >= MAX_FAILED_LOGINS) {
    const bonus = Math.min(voterBehavior.failedLogins * 3, FRAUD_WEIGHTS.FAILED_LOGINS);
    score += bonus;
    triggeredSignals.push('FAILED_LOGINS');
    details.failedLogins = `${voterBehavior.failedLogins} failed logins. +${bonus} points`;
  }

  // Signal 6: Voting at unusual hours (2AM - 5AM)
  if (voterBehavior.votingHour !== undefined) {
    const hour = voterBehavior.votingHour;
    if (hour >= 2 && hour <= 5) {
      score += FRAUD_WEIGHTS.ODD_HOUR_VOTE;
      triggeredSignals.push('ODD_HOUR_VOTE');
      details.oddHour = `Vote at ${hour}:00 (unusual hour). +${FRAUD_WEIGHTS.ODD_HOUR_VOTE} points`;
    }
  }

  // Signal 7: Suspicious user agent (headless browser)
  if (voterBehavior.suspiciousUA) {
    score += FRAUD_WEIGHTS.SUSPICIOUS_UA;
    triggeredSignals.push('SUSPICIOUS_UA');
    details.suspiciousUA = `Headless/bot user agent detected. +${FRAUD_WEIGHTS.SUSPICIOUS_UA} points`;
  }

  // Signal 8: High frequency requests
  if (voterBehavior.rapidRequests) {
    score += FRAUD_WEIGHTS.RAPID_REQUESTS;
    triggeredSignals.push('RAPID_REQUESTS');
    details.rapidRequests = `Abnormal request frequency. +${FRAUD_WEIGHTS.RAPID_REQUESTS} points`;
  }

  // Greedy decision: cap at 100
  score = Math.min(score, 100);

  const risk = score >= HIGH_RISK_THRESHOLD ? 'HIGH'
    : score >= MEDIUM_RISK_THRESHOLD ? 'MEDIUM' : 'LOW';

  return {
    score,
    risk,
    triggeredSignals,
    details,
    recommendation: risk === 'HIGH' ? 'AUTO_BLOCK'
      : risk === 'MEDIUM' ? 'FLAG_FOR_REVIEW' : 'ALLOW',
    maxPossibleScore: Object.values(FRAUD_WEIGHTS).reduce((a, b) => a + b, 0)
  };
}

/**
 * Quick fraud assessment for real-time vote casting
 * Returns immediate go/no-go decision
 */
function quickFraudAssessment(voterBehavior) {
  const result = calculateFraudScore(voterBehavior);
  return {
    ...result,
    shouldBlock: result.risk === 'HIGH',
    shouldFlag: result.risk === 'MEDIUM'
  };
}

/**
 * Build voter behavior from request context
 */
function extractVoterBehavior(req, voter, timingMs) {
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  const currentIP = req.ip || req.connection.remoteAddress || '0.0.0.0';
  const votingHour = new Date().getHours();

  const unknownIP = voter.lastLoginIP && voter.lastLoginIP !== currentIP;
  const voting_time_sec = timingMs / 1000;

  const headlessBrowsers = ['headless', 'phantom', 'selenium', 'puppeteer', 'nightmare', 'bot', 'crawler'];
  const suspiciousUA = headlessBrowsers.some(kw => ua.includes(kw));

  return {
    unknownIP,
    votingTimeSec: voting_time_sec,
    deviceMismatch: false, // set by caller based on fingerprint comparison
    locationAnomaly: false, // simplified: would use IP geolocation in production
    failedLogins: voter.loginAttempts || 0,
    votingHour,
    suspiciousUA,
    rapidRequests: false
  };
}

/**
 * Registration-time fraud scoring
 * Signals detected BEFORE or DURING voter registration.
 * These are passive signals — not behavioral — based on what the user
 * submitted and whether they triggered validation errors.
 */
const REGISTRATION_FRAUD_WEIGHTS = {
  NO_PHOTO: 20,           // No face photo submitted
  UNCLEAR_PHOTO: 15,      // Photo submitted but no face descriptor detected (face unclear/fake)
  TRIED_UNDERAGE: 15,     // Entered a DOB that was under 18 before correcting
  TRIED_DUPLICATE_ID: 20, // Attempted to use an already-registered Voter ID or Aadhaar
};

function calculateRegistrationFraudScore({ photoBase64, faceDescriptor, triedUnderageEntry, hadDuplicateAttempt }) {
  let score = 0;
  const triggeredSignals = [];

  // Signal 1: No photo provided at all (Safety check: Ensure photoBase64 exists)
  if (!photoBase64 || (typeof photoBase64 === 'string' && photoBase64.length < 500)) {
    score += REGISTRATION_FRAUD_WEIGHTS.NO_PHOTO;
    triggeredSignals.push('NO_PHOTO');
  } else if (!faceDescriptor || faceDescriptor.length === 0) {
    // Photo provided but no face was detected — could be a fake/unclear image
    score += REGISTRATION_FRAUD_WEIGHTS.UNCLEAR_PHOTO;
    triggeredSignals.push('UNCLEAR_PHOTO');
  }

  // Signal 2: User attempted to enter an underage DOB
  if (triedUnderageEntry) {
    score += REGISTRATION_FRAUD_WEIGHTS.TRIED_UNDERAGE;
    triggeredSignals.push('TRIED_UNDERAGE');
  }

  // Signal 3: User attempted to use a duplicate Voter ID or Aadhaar that was already registered
  if (hadDuplicateAttempt) {
    score += REGISTRATION_FRAUD_WEIGHTS.TRIED_DUPLICATE_ID;
    triggeredSignals.push('TRIED_DUPLICATE_ID');
  }

  score = Math.min(score, 100);
  const risk = score >= HIGH_RISK_THRESHOLD ? 'HIGH'
    : score >= MEDIUM_RISK_THRESHOLD ? 'MEDIUM' : 'LOW';

  return { score, risk, triggeredSignals };
}

module.exports = {
  calculateFraudScore,
  quickFraudAssessment,
  extractVoterBehavior,
  calculateRegistrationFraudScore,
  FRAUD_WEIGHTS,
  REGISTRATION_FRAUD_WEIGHTS,
  HIGH_RISK_THRESHOLD,
  MEDIUM_RISK_THRESHOLD,
  COMPLEXITY: {
    name: 'Greedy Fraud Scoring',
    purpose: 'Real-time multi-signal fraud risk assessment',
    time: 'O(k) where k = number of signals (constant)',
    space: 'O(1) — no extra memory',
    worstCase: 'O(k) always',
    implementation: 'Greedy weight accumulation over behavioral signals'
  }
};
