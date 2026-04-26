/**
 * Pattern Detection Engine — Merge Sort + Sliding Window Analysis
 * Algorithm: Merge Sort O(n log n) + Sliding Window O(n)
 * 
 * Core DAA Concept: Divide & Conquer + Frequency Analysis
 * Time Complexity: O(n log n) for sorting + O(n) for window scan = O(n log n)
 * Space Complexity: O(n) for sorted array + window buffers
 */

const BURST_THRESHOLD = 10;  // votes per window to flag
const WINDOW_SIZE_MS = 60000; // 60 second window

/**
 * Merge Sort implementation for vote sorting by timestamp
 * Divide & Conquer approach
 * T(n) = 2T(n/2) + O(n) → O(n log n) by Master Theorem
 */
function mergeSort(arr, key) {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid), key);
  const right = mergeSort(arr.slice(mid), key);

  return merge(left, right, key);
}

function merge(left, right, key) {
  const result = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    const leftVal = key ? new Date(left[i][key]).getTime() : left[i];
    const rightVal = key ? new Date(right[j][key]).getTime() : right[j];

    if (leftVal <= rightVal) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  return [...result, ...left.slice(i), ...right.slice(j)];
}

/**
 * Sliding Window Analysis for burst voting detection
 * Finds time windows with suspicious vote concentration
 * O(n) after sort since we use two-pointer technique
 */
function slidingWindowAnalysis(sortedVotes, windowSizeMs = WINDOW_SIZE_MS) {
  const windows = [];
  let left = 0;

  for (let right = 0; right < sortedVotes.length; right++) {
    const rightTime = new Date(sortedVotes[right].timestamp).getTime();

    // Shrink window from left if outside time range
    while (left < right) {
      const leftTime = new Date(sortedVotes[left].timestamp).getTime();
      if (rightTime - leftTime > windowSizeMs) {
        left++;
      } else {
        break;
      }
    }

    const windowCount = right - left + 1;

    // Group by IP within window
    const ipGroups = {};
    for (let k = left; k <= right; k++) {
      const ip = sortedVotes[k].ipAddress;
      ipGroups[ip] = (ipGroups[ip] || 0) + 1;
    }

    windows.push({
      startTime: new Date(sortedVotes[left].timestamp),
      endTime: new Date(sortedVotes[right].timestamp),
      count: windowCount,
      votes: sortedVotes.slice(left, right + 1),
      ipGroups,
      isSuspicious: windowCount > BURST_THRESHOLD
    });
  }

  return windows;
}

/**
 * Detect burst voting: many votes in short time from same IP
 * Primary fraud detection for bot activity
 */
function detectBurstVoting(votes) {
  if (!votes || votes.length === 0) return [];

  const sorted = mergeSort([...votes], 'timestamp');
  const windows = slidingWindowAnalysis(sorted);

  const suspiciousWindows = windows.filter(w => w.isSuspicious);
  const flaggedIPs = new Set();

  suspiciousWindows.forEach(w => {
    Object.entries(w.ipGroups).forEach(([ip, count]) => {
      if (count > BURST_THRESHOLD / 2) {
        flaggedIPs.add(ip);
      }
    });
  });

  return {
    suspiciousWindows,
    flaggedIPs: Array.from(flaggedIPs),
    totalSuspiciousVotes: suspiciousWindows.reduce((sum, w) => sum + w.count, 0),
    burstCount: suspiciousWindows.length
  };
}

/**
 * Frequency analysis: count votes per candidate, detect anomalies
 * Uses counting sort O(k) where k = number of candidates
 */
function analyzeVoteFrequency(votes) {
  const frequency = {};

  for (const vote of votes) {
    const key = vote.candidateId;
    frequency[key] = (frequency[key] || 0) + 1;
  }

  const total = votes.length;
  const entries = Object.entries(frequency).map(([id, count]) => ({
    candidateId: parseInt(id),
    count,
    percentage: total > 0 ? ((count / total) * 100).toFixed(2) : 0
  }));

  // Sort descending by count O(k log k)
  entries.sort((a, b) => b.count - a.count);

  // Detect statistical anomaly: one candidate gets >> expected share
  const expected = 100 / (entries.length || 1);
  const anomalies = entries.filter(e => parseFloat(e.percentage) > expected * 3);

  return { frequency: entries, anomalies, total };
}

/**
 * Binary Search for voter lookup by VoterID
 * Voters are indexed/sorted in MongoDB, simulating binary search
 * T(n) = O(log n)
 */
function binarySearchVoter(sortedVoters, targetVoterID) {
  let low = 0, high = sortedVoters.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const comparison = sortedVoters[mid].voterID.localeCompare(targetVoterID);

    if (comparison === 0) return { found: true, index: mid, voter: sortedVoters[mid] };
    if (comparison < 0) low = mid + 1;
    else high = mid - 1;
  }

  return { found: false, index: -1, voter: null };
}

module.exports = {
  mergeSort,
  slidingWindowAnalysis,
  detectBurstVoting,
  analyzeVoteFrequency,
  binarySearchVoter,
  BURST_THRESHOLD,
  WINDOW_SIZE_MS,
  COMPLEXITY: {
    name: 'Merge Sort + Sliding Window',
    purpose: 'Burst voting & bot pattern detection',
    time: 'O(n log n) sort + O(n) window scan',
    space: 'O(n) for sorted copy',
    worstCase: 'O(n log n)',
    implementation: 'Divide & Conquer Merge Sort + Two-Pointer Sliding Window'
  }
};
