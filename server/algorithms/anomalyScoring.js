/**
 * Anomaly Scoring Engine — Dynamic Programming (DP)
 * Algorithm: Longest Suspicious Sequence (LSS) via DP
 * 
 * Core DAA Concept: Dynamic Programming — optimal substructure + overlapping subproblems
 * Time Complexity: O(n²) for LSS computation
 * Space Complexity: O(n) for DP table
 * 
 * Model: Voter's action log as a sequence of events.
 * DP finds the longest subsequence of "suspicious" actions.
 * If LSS > threshold → voter is high-risk.
 */

// Suspicious action types and their weights
const ACTION_WEIGHTS = {
  FAILED_LOGIN: 3,
  RAPID_PAGE_NAVIGATION: 2,
  COPY_PASTE_DETECTION: 2,
  ABNORMAL_SCROLL: 1,
  MULTIPLE_CANDIDATE_VIEWS: 2,
  IDLE_THEN_RAPID: 3,
  BACK_FORWARD_RAPID: 1,
  FORM_AUTOFILL: 2,
  VOTE_PAGE_REVISIT: 4,
  REPEATED_SUBMIT: 5,
};

const LSS_THRESHOLD = 8; // Longest suspicious sequence score threshold

/**
 * Validate if an action is suspicious based on type
 */
function isSuspiciousAction(action) {
  return Object.keys(ACTION_WEIGHTS).includes(action.type);
}

/**
 * Get weight/score of an action
 */
function getActionWeight(action) {
  return ACTION_WEIGHTS[action.type] || 0;
}

/**
 * Dynamic Programming: Longest Suspicious Sequence (LSS)
 * 
 * Similar to Longest Increasing Subsequence (LIS) but for suspicious actions.
 * dp[i] = maximum suspicious score achievable ending at action i
 * 
 * Recurrence:
 *   dp[0] = weight(action[0]) if suspicious, else 0
 *   dp[i] = max(dp[i-1] + weight(action[i]), weight(action[i])) if suspicious
 *           max(dp[i-1], 0) if not suspicious
 * 
 * This is actually the maximum subarray variant (Kadane's algorithm adapted for sequences)
 * T(n) = O(n), Space = O(n)
 */
function longestSuspiciousSequence(actionLog) {
  if (!actionLog || actionLog.length === 0) {
    return { score: 0, sequence: [], indices: [] };
  }

  const n = actionLog.length;
  const dp = new Array(n).fill(0);
  const parent = new Array(n).fill(-1);

  // Initialize first element
  dp[0] = isSuspiciousAction(actionLog[0]) ? getActionWeight(actionLog[0]) : 0;

  let maxScore = dp[0];
  let maxIndex = 0;

  // Fill DP table - O(n)
  for (let i = 1; i < n; i++) {
    const weight = getActionWeight(actionLog[i]);
    const isSuspicious = isSuspiciousAction(actionLog[i]);

    if (isSuspicious) {
      // Extend previous sequence or start new one
      if (dp[i - 1] > 0) {
        dp[i] = dp[i - 1] + weight;
        parent[i] = i - 1;
      } else {
        dp[i] = weight;
      }
    } else {
      // Non-suspicious action: carry forward but with decay
      dp[i] = Math.max(0, dp[i - 1] - 1);
      parent[i] = dp[i] > 0 ? i - 1 : -1;
    }

    if (dp[i] > maxScore) {
      maxScore = dp[i];
      maxIndex = i;
    }
  }

  // Backtrack to find the sequence
  const indices = [];
  let idx = maxIndex;
  while (idx >= 0 && dp[idx] > 0) {
    if (isSuspiciousAction(actionLog[idx])) {
      indices.unshift(idx);
    }
    idx = parent[idx];
    if (idx === parent[idx]) break; // avoid infinite loop
  }

  const sequence = indices.map(i => actionLog[i]);

  return {
    score: maxScore,
    sequence,
    indices,
    isHighRisk: maxScore >= LSS_THRESHOLD,
    dpTable: dp
  };
}

/**
 * Full DP analysis: O(n²) variant for finding all suspicious subsequences
 * Uses 2D DP to find patterns between any pair of actions
 */
function fullPatternAnalysis(actionLog) {
  if (!actionLog || actionLog.length === 0) return { patterns: [], riskScore: 0 };

  const n = actionLog.length;

  // dp[i][j] = max suspicious weight from action i to action j
  // Only computed for suspicious pairs
  const patterns = [];
  let totalRisk = 0;

  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      if (isSuspiciousAction(actionLog[i]) && isSuspiciousAction(actionLog[j])) {
        const timeGap = new Date(actionLog[j].timestamp) - new Date(actionLog[i].timestamp);
        const timeGapSec = timeGap / 1000;

        // Rapid successive suspicious actions are more concerning
        if (timeGapSec < 10) {
          const patternScore = getActionWeight(actionLog[i]) + getActionWeight(actionLog[j]);
          patterns.push({
            from: actionLog[i].type,
            to: actionLog[j].type,
            timeGapSec,
            score: patternScore
          });
          totalRisk += patternScore;
        }
      }
    }
  }

  return { patterns, riskScore: Math.min(totalRisk, 100) };
}

/**
 * Compute behavioral risk score for a voter
 * Combines LSS score with pattern analysis
 */
function computeBehavioralRiskScore(actionLog) {
  const lssResult = longestSuspiciousSequence(actionLog);
  const patternResult = fullPatternAnalysis(actionLog);

  const combinedScore = Math.min(
    (lssResult.score / LSS_THRESHOLD) * 60 + (patternResult.riskScore / 100) * 40,
    100
  );

  return {
    lssScore: lssResult.score,
    lssSequence: lssResult.sequence,
    patternRisk: patternResult.riskScore,
    combinedScore: Math.round(combinedScore),
    isHighRisk: combinedScore >= 60,
    dpTable: lssResult.dpTable,
    suspiciousPatterns: patternResult.patterns.slice(0, 10)
  };
}

/**
 * Create sample action log from voter behavior data
 */
function buildActionLog(voterData) {
  const actions = [];

  if (voterData.failedLogins > 0) {
    for (let i = 0; i < voterData.failedLogins; i++) {
      actions.push({
        type: 'FAILED_LOGIN',
        timestamp: new Date(Date.now() - (voterData.failedLogins - i) * 60000),
        metadata: { attempt: i + 1 }
      });
    }
  }

  if (voterData.rapidNavigation) {
    actions.push({
      type: 'RAPID_PAGE_NAVIGATION',
      timestamp: new Date(),
      metadata: {}
    });
  }

  if (voterData.votePageRevisit) {
    actions.push({
      type: 'VOTE_PAGE_REVISIT',
      timestamp: new Date(),
      metadata: {}
    });
  }

  // Sort by timestamp
  actions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return actions;
}

module.exports = {
  longestSuspiciousSequence,
  fullPatternAnalysis,
  computeBehavioralRiskScore,
  buildActionLog,
  isSuspiciousAction,
  getActionWeight,
  ACTION_WEIGHTS,
  LSS_THRESHOLD,
  COMPLEXITY: {
    name: 'Dynamic Programming (LSS)',
    purpose: 'Behavioral pattern analysis & anomaly scoring',
    time: 'O(n) for LSS (Kadane variant) | O(n²) for full pattern analysis',
    space: 'O(n) for DP table',
    worstCase: 'O(n²) with full pattern analysis',
    implementation: 'Longest Suspicious Sequence via DP + Sliding pattern detection'
  }
};
