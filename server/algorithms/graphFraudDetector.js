/**
 * Graph Fraud Detector — BFS/DFS for Fraud Cluster Detection
 * Algorithm: Graph Traversal (BFS for cluster discovery)
 * 
 * Core DAA Concept: Graph Algorithms — BFS/DFS on adjacency list
 * Time Complexity: O(V + E) where V = voters, E = shared IP/device edges
 * Space Complexity: O(V + E) for adjacency list + O(V) for visited set
 * 
 * Model: Voters = nodes, Shared IP or Device Fingerprint = edges
 * Fraud Ring = Connected component with size >= CLUSTER_THRESHOLD
 */

const CLUSTER_THRESHOLD = 3; // min cluster size to flag as fraud

/**
 * Build adjacency graph from vote records
 * Nodes: voter IDs
 * Edges: voters who share the same IP address or device fingerprint
 * O(n^2) worst case, O(n * avg_duplicates) average
 */
function buildVoterGraph(votes) {
  const adjacencyList = {}; // { voterID: Set<voterID> }
  const ipToVoters = {}; // { ip: [voterIDs] }
  const deviceToVoters = {}; // { deviceFP: [voterIDs] }

  // Initialize nodes
  for (const vote of votes) {
    if (!adjacencyList[vote.voterID]) {
      adjacencyList[vote.voterID] = new Set();
    }

    // Group by IP
    if (vote.ipAddress) {
      if (!ipToVoters[vote.ipAddress]) ipToVoters[vote.ipAddress] = [];
      ipToVoters[vote.ipAddress].push(vote.voterID);
    }

    // Group by device fingerprint
    if (vote.deviceFingerprint) {
      if (!deviceToVoters[vote.deviceFingerprint]) deviceToVoters[vote.deviceFingerprint] = [];
      deviceToVoters[vote.deviceFingerprint].push(vote.voterID);
    }
  }

  // Add edges for shared IPs
  for (const [ip, voterList] of Object.entries(ipToVoters)) {
    if (voterList.length > 1) {
      for (let i = 0; i < voterList.length; i++) {
        for (let j = i + 1; j < voterList.length; j++) {
          const a = voterList[i], b = voterList[j];
          if (!adjacencyList[a]) adjacencyList[a] = new Set();
          if (!adjacencyList[b]) adjacencyList[b] = new Set();
          adjacencyList[a].add(b);
          adjacencyList[b].add(a);
        }
      }
    }
  }

  // Add edges for shared device fingerprints
  for (const [device, voterList] of Object.entries(deviceToVoters)) {
    if (voterList.length > 1) {
      for (let i = 0; i < voterList.length; i++) {
        for (let j = i + 1; j < voterList.length; j++) {
          const a = voterList[i], b = voterList[j];
          if (!adjacencyList[a]) adjacencyList[a] = new Set();
          if (!adjacencyList[b]) adjacencyList[b] = new Set();
          adjacencyList[a].add(b);
          adjacencyList[b].add(a);
        }
      }
    }
  }

  return { adjacencyList, ipToVoters, deviceToVoters };
}

/**
 * BFS traversal to find all connected components
 * Each component is a potential fraud cluster
 * Time: O(V + E), Space: O(V)
 */
function bfsComponent(startNode, adjacencyList, visited) {
  const queue = [startNode];
  const component = [];
  visited.add(startNode);

  while (queue.length > 0) {
    const node = queue.shift(); // dequeue O(1) with shift
    component.push(node);

    const neighbors = adjacencyList[node] || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return component;
}

/**
 * DFS traversal for deeper graph exploration
 * Used to trace fraud propagation paths
 * Time: O(V + E), Space: O(V) recursive stack
 */
function dfsComponent(node, adjacencyList, visited, component = []) {
  visited.add(node);
  component.push(node);

  const neighbors = adjacencyList[node] || new Set();
  for (const neighbor of neighbors) {
    if (!visited.has(neighbor)) {
      dfsComponent(neighbor, adjacencyList, visited, component);
    }
  }

  return component;
}

/**
 * Main fraud cluster detection function
 * Finds all connected components using BFS
 * Flags components with size >= CLUSTER_THRESHOLD as fraud rings
 */
function detectFraudClusters(votes) {
  if (!votes || votes.length === 0) {
    return { clusters: [], fraudRings: [], totalFraudNodes: 0 };
  }

  const { adjacencyList, ipToVoters, deviceToVoters } = buildVoterGraph(votes);
  const visited = new Set();
  const clusters = [];

  for (const node of Object.keys(adjacencyList)) {
    if (!visited.has(node)) {
      const component = bfsComponent(node, adjacencyList, visited);
      clusters.push({
        members: component,
        size: component.length,
        isFraudRing: component.length >= CLUSTER_THRESHOLD
      });
    }
  }

  const fraudRings = clusters.filter(c => c.isFraudRing);
  const fraudNodes = fraudRings.flatMap(r => r.members);
  const totalFraudNodes = new Set(fraudNodes).size;

  // Build edge list for visualization (D3.js compatible)
  const edges = [];
  const edgeSet = new Set();
  for (const [node, neighbors] of Object.entries(adjacencyList)) {
    for (const neighbor of neighbors) {
      const edgeKey = [node, neighbor].sort().join('--');
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        edges.push({ source: node, target: neighbor });
      }
    }
  }

  return {
    clusters,
    fraudRings,
    totalFraudNodes,
    totalClusters: clusters.length,
    edges,
    ipToVoters,
    deviceToVoters,
    nodes: Object.keys(adjacencyList).map(id => ({
      id,
      isFraudNode: fraudNodes.includes(id)
    }))
  };
}

module.exports = {
  buildVoterGraph,
  bfsComponent,
  dfsComponent,
  detectFraudClusters,
  CLUSTER_THRESHOLD,
  COMPLEXITY: {
    name: 'BFS/DFS Graph Traversal',
    purpose: 'Fraud ring & voter cluster detection',
    time: 'O(V + E) where V=voters, E=shared IP/device edges',
    space: 'O(V + E) adjacency list + O(V) visited set',
    worstCase: 'O(n²) dense graph',
    implementation: 'BFS connected components on voter-IP-device graph'
  }
};
