/**
 * Computes edit distance between two strings.
 * Used to detect name impersonation (e.g. "Rahul Sharma" vs "Rahul Shar ma")
 * Time: O(m*n) | Space: O(m*n) — Dynamic Programming
 */
function levenshteinDistance(str1, str2) {
  if (!str1 || !str2) return 0;
  const m = str1.length, n = str2.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Fraud threshold: distance > 3 on names that SHOULD be identical = flag
 */
function isSuspiciousName(registeredName, votedName) {
  if (!votedName) return false;
  const dist = levenshteinDistance(registeredName, votedName);
  return dist > 3;
}

module.exports = { levenshteinDistance, isSuspiciousName };
