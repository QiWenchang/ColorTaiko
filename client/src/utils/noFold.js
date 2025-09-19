/**
 * No-Fold checker
 *
 * Re-implementation of the no-fold logic currently embedded in updateHorizontalEdges,
 * but exposed as a pure check function with a unified { ok, message } result.
 *
 * Expected usage:
 *   const res = noFold(latestPair, {
 *     connectionPairs,
 *     topOrientation,   // React ref: { current: Map<string, 'left'|'right'> }
 *     botOrientation,    // React ref: { current: Map<string, 'left'|'right'> }
 *     horiEdgesRef,      // React ref: { current: Map<string, [Map, Map]> } (optional but supported)
 *     foldsFound         // Set<string> (will be cleared and re-filled)
 *   });
 *   if (!res.ok) { // show message, highlight via foldsFound elsewhere }
 */

/**
 * Normalize two node IDs to a stable, sorted key "min,max".
 * @param {string} a
 * @param {string} b
 * @returns {string}
 */
function normalizePairKey(a, b) {
  if (a <= b) return `${a},${b}`;
  return `${b},${a}`;
}

/**
 * Ensure a node entry exists in the horizontal edges ref map.
 * The structure matches the legacy implementation: Map<nodeId, [outMap, inMap]>.
 * Each map stores both neighbor->color and color->neighbor entries.
 * @param {Map<string, [Map, Map]>} refMap
 * @param {string} nodeId
 */
function ensureNodeRef(refMap, nodeId) {
  if (!refMap.has(nodeId)) {
    refMap.set(nodeId, [new Map(), new Map()]);
  }
}

/**
 * Log a directed horizontal edge into the ref structure with dual-keying
 * to allow fold detection via odd map sizes (as in the legacy logic).
 * @param {Map<string, [Map, Map]>} refMap
 * @param {string} from
 * @param {string} to
 * @param {string} color
 */
function addDirectedEdge(refMap, from, to, color) {
  ensureNodeRef(refMap, from);
  ensureNodeRef(refMap, to);

  const fromOut = refMap.get(from)[0];
  const toIn = refMap.get(to)[1];

  // neighbor -> color
  fromOut.set(to, color);
  toIn.set(from, color);

  // color -> neighbor (last-wins overwrite used by detection)
  fromOut.set(color, to);
  toIn.set(color, from);
}

/**
 * Build the horizontal edges map for all completed connection pairs using the
 * current top/bottom orientations.
 * @param {Array<Array<{nodes: [string,string], color: string}>>} connectionPairs
 * @param {{ current: Map<string, 'left'|'right'> }} topOrientation
 * @param {{ current: Map<string, 'left'|'right'> }} botOrientation
 * @returns {Map<string, [Map, Map]>}
 */
function buildHorizontalEdges(connectionPairs, topOrientation, botOrientation) {
  const refMap = new Map();

  for (const pair of connectionPairs) {
    if (!pair || pair.length !== 2) continue;

    const [firstConnection, secondConnection] = pair;
    const [top1, bottom1] = firstConnection.nodes;
    const [top2, bottom2] = secondConnection.nodes;
    const color = secondConnection.color; // both connections share the same color after grouping

    // Sorted combinations as keys for orientation maps
    const tops = [top1, top2].sort();
    const bottoms = [bottom1, bottom2].sort();
    const topKey = tops.join(',');
    const botKey = bottoms.join(',');

    const topDir = topOrientation?.current?.get(topKey);
    const botDir = botOrientation?.current?.get(botKey);

    // Add top-row horizontal edge
    if (topDir === 'right') {
      addDirectedEdge(refMap, tops[0], tops[1], color);
    } else if (topDir === 'left') {
      addDirectedEdge(refMap, tops[1], tops[0], color);
    }

    // Add bottom-row horizontal edge
    if (botDir === 'right') {
      addDirectedEdge(refMap, bottoms[0], bottoms[1], color);
    } else if (botDir === 'left') {
      addDirectedEdge(refMap, bottoms[1], bottoms[0], color);
    }
  }

  return refMap;
}

/**
 * Detect fold conflicts using the legacy odd-size map heuristic and produce
 * a set of pair keys ("nodeA,nodeB") to be highlighted.
 * @param {Map<string, [Map, Map]>} refMap
 * @returns {Set<string>} Set of normalized pair keys involved in folds
 */
function detectFolds(refMap) {
  const folds = new Set();

  for (const [mapNode, [outMap, inMap]] of refMap.entries()) {
    // Check both outgoing and incoming maps
    for (const edgeMap of [outMap, inMap]) {
      // In the legacy representation, a consistent mapping yields an even size:
      // for each (neighbor->color), there is a (color->neighbor).
      // If the same color is associated to multiple neighbors, one of the
      // color->neighbor entries gets overwritten, making the size odd.
      if (edgeMap.size % 2 !== 0) {
        for (const [otherNode, value] of edgeMap.entries()) {
          // Only consider entries where the value is a color string (e.g. "#RRGGBB")
          if (typeof value === 'string' && value.startsWith('#')) {
            const trueNode = edgeMap.get(value);
            if (trueNode && trueNode !== otherNode) {
              // Flag both conflicting edges at mapNode
              folds.add(normalizePairKey(mapNode, otherNode));
              folds.add(normalizePairKey(mapNode, trueNode));
            }
          }
        }
      }
    }
  }

  return folds;
}

/**
 * Expected signature: (latestPair, context) => ({ ok: boolean, message?: string })
 * This implementation computes the no-fold condition across all completed pairs
 * in context.connectionPairs using context.topOrientation/botOrientation.
 * It updates context.foldsFound (if provided) and context.horiEdgesRef.current (if provided).
 * No UI side effects (no drawing, no setErrorMessage) are performed here.
 *
 * @param {Array<{nodes: [string,string], color: string}>} latestPair - The most recent completed pair (unused for the computation, but kept for API symmetry)
 * @param {Object} context
 * @param {Array<Array<{nodes: [string,string], color: string}>>} context.connectionPairs
 * @param {{ current: Map<string, 'left'|'right'> }} context.topOrientation
 * @param {{ current: Map<string, 'left'|'right'> }} context.botOrientation
 * @param {{ current: Map<string, [Map, Map]> }} [context.horiEdgesRef]
 * @param {Set<string>} [context.foldsFound]
 * @returns {{ ok: boolean, message?: string }}
 */
export function noFold(latestPair, context) {
  void latestPair; // currently unused; retained for future optimizations if needed

  const {
    connectionPairs,
    topOrientation,
    botOrientation,
    horiEdgesRef,
    foldsFound,
  } = context || {};

  // Defensive checks
  if (!connectionPairs || !topOrientation || !botOrientation) {
    return { ok: true }; // nothing to validate
  }

  // Build the horizontal edges ref map
  const refMap = buildHorizontalEdges(connectionPairs, topOrientation, botOrientation);

  // Persist into provided refs/sets if present
  if (horiEdgesRef && typeof horiEdgesRef === 'object') {
    horiEdgesRef.current = refMap;
  }

  const detected = detectFolds(refMap);

  if (foldsFound && foldsFound instanceof Set) {
    foldsFound.clear();
    for (const key of detected) foldsFound.add(key);
  }

  if (detected.size > 0) {
    return { ok: false, message: 'No-Fold condition failed!' };
  }

  return { ok: true };
}
