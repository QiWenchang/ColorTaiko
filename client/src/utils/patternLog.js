/**
 * Pattern Log utilities for maintaining horizontal edge sequences
 * Used by noFold and noPattern checks
 */

function serializeSequence(sequence) {
  return (Array.isArray(sequence) ? sequence : []).map(
    ({ id, nodes, color, orientation, pairId }) => ({
      id,
      nodes,
      color,
      orientation,
      pairId,
    })
  );
}

function debugPatternLog(patternLog, action) {
  if (!patternLog) return;

  const summary = {
    action,
    topSequence: serializeSequence(patternLog.topSequence),
    bottomSequence: serializeSequence(patternLog.bottomSequence),
    timestamp: new Date().toISOString(),
  };

  console.debug("[PatternLog]", summary);
}

/**
 * Creates a horizontal edge record
 * @param {string} pairId - Unique identifier for the connection pair
 * @param {Array<string>} nodes - Two node IDs that form this horizontal edge
 * @param {string} color - Color of the connection pair
 * @param {string} orientation - "left" or "right" direction
 * @returns {Object} Horizontal edge record
 */
export function createHorizontalEdge(pairId, nodes, color, orientation) {
  const sortedNodes = [...nodes].sort();
  return {
    id: sortedNodes.join(','),
    nodes: sortedNodes,
    color,
    orientation,
    pairId,
    createdAt: Date.now()
  };
}

/**
 * Appends horizontal edges to pattern log for a completed connection pair
 * @param {Object} patternLog - Pattern log ref with topSequence and bottomSequence
 * @param {string} pairId - Unique identifier for this pair
 * @param {Object} pairData - Contains topNodes, bottomNodes, color, topOrientation, bottomOrientation
 */
export function appendHorizontalEdges(patternLog, pairId, pairData) {
  const { topNodes, bottomNodes, color, topOrientation, bottomOrientation } = pairData;

  if (topOrientation) {
    const topEdge = createHorizontalEdge(pairId, topNodes, color, topOrientation);
    patternLog.topSequence.push(topEdge);
  }

  if (bottomOrientation) {
    const bottomEdge = createHorizontalEdge(pairId, bottomNodes, color, bottomOrientation);
    patternLog.bottomSequence.push(bottomEdge);
  }

  debugPatternLog(patternLog, `append:${pairId}`);
}

/**
 * Removes horizontal edges by pairId (for undo operations)
 * @param {Object} patternLog - Pattern log ref
 * @param {string} pairId - Pair ID to remove
 */
export function removeHorizontalEdgesByPairId(patternLog, pairId) {
  patternLog.topSequence = patternLog.topSequence.filter(edge => edge.pairId !== pairId);
  patternLog.bottomSequence = patternLog.bottomSequence.filter(edge => edge.pairId !== pairId);

  debugPatternLog(patternLog, `remove:${pairId}`);
}

/**
 * Clears all horizontal edges (for clear operations)
 * @param {Object} patternLog - Pattern log ref
 */
export function clearPatternLog(patternLog) {
  patternLog.topSequence = [];
  patternLog.bottomSequence = [];

  debugPatternLog(patternLog, "clear");
}

/**
 * Normalize connection pair into a stable key
 */
export function buildPairKey(pair) {
  if (!Array.isArray(pair)) return '';

  const normalized = pair
    .map((connection) => {
      const nodes = Array.isArray(connection?.nodes)
        ? [...connection.nodes].sort()
        : ['__missing__'];
      return nodes.join('|');
    })
    .sort();

  return JSON.stringify(normalized);
}

/**
 * Update existing horizontal edges orientation when global orientations flip
 * @param {Object} patternLog
 * @param {Array<{ id: string, orientation: string }>} updates
 */
export function updatePatternLogOrientations(patternLog, updates) {
  if (!patternLog || !Array.isArray(updates)) return;

  updates.forEach(({ id, orientation }) => {
    if (!id || !orientation) return;

    const targetSequence = id.startsWith('top-')
      ? patternLog.topSequence
      : patternLog.bottomSequence;

    if (!Array.isArray(targetSequence)) return;

    for (const edge of targetSequence) {
      if (edge.id === id) {
        edge.orientation = orientation;
      }
    }
  });

  if (updates.length > 0) {
    debugPatternLog(patternLog, `update-orientations:${updates.map(u => u.id).join(',')}`);
  }
}

/**
 * Derive horizontal edges (without mutating log) from the latest connection pair
 */
export function deriveHorizontalEdgesFromPair(pair, topOrientation, botOrientation) {
  if (!Array.isArray(pair) || pair.length !== 2) {
    return { pairId: '', topEdge: null, bottomEdge: null };
  }

  const [firstConnection, secondConnection] = pair;
  const [top1, bottom1] = firstConnection.nodes;
  const [top2, bottom2] = secondConnection.nodes;
  const color = secondConnection.color;

  const topNodes = [top1, top2].sort();
  const bottomNodes = [bottom1, bottom2].sort();
  const topKey = topNodes.join(',');
  const bottomKey = bottomNodes.join(',');

  const topDir = topOrientation?.current?.get(topKey);
  const botDir = botOrientation?.current?.get(bottomKey);

  const pairId = buildPairKey(pair);

  return {
    pairId,
    topEdge: topDir ? createHorizontalEdge(pairId, topNodes, color, topDir) : null,
    bottomEdge: botDir ? createHorizontalEdge(pairId, bottomNodes, color, botDir) : null,
  };
}

/**
 * Rebuilds pattern log from connection pairs history
 * @param {Object} patternLog - Pattern log ref
 * @param {Array} connectionPairs - Array of connection pairs
 * @param {Object} topOrientation - Top orientation map ref
 * @param {Object} botOrientation - Bottom orientation map ref
 */
export function rebuildPatternLog(patternLog, connectionPairs, topOrientation, botOrientation) {
  clearPatternLog(patternLog);
  
  connectionPairs.forEach((pair, index) => {
    if (!pair || pair.length !== 2) return;
    
    const [firstConnection, secondConnection] = pair;
    const [top1, bottom1] = firstConnection.nodes;
    const [top2, bottom2] = secondConnection.nodes;
    const color = secondConnection.color;
    
    const topNodes = [top1, top2].sort();
    const bottomNodes = [bottom1, bottom2].sort();
    const topKey = topNodes.join(',');
    const bottomKey = bottomNodes.join(',');
    
    const topDir = topOrientation?.current?.get(topKey);
    const botDir = botOrientation?.current?.get(bottomKey);
    
    const pairId = buildPairKey(pair) || `pair-${index}`;
    
    appendHorizontalEdges(patternLog, pairId, {
      topNodes,
      bottomNodes,
      color,
      topOrientation: topDir,
      bottomOrientation: botDir
    });
  });

  debugPatternLog(patternLog, "rebuild:complete");
}