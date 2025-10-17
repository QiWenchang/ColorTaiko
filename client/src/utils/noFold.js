/**
 * Robust no-fold validation utilities.
 *
 * Derived horizontal edges are grouped by colour; for each colour we ensure a
 * node has at most one outgoing and one incoming edge. Violations indicate a
 * “fold” in the puzzle.
 */

const FALLBACK_COLOR_PREFIX = "__uncoloured__:";

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function ensureColor(color, key) {
  return color ?? `${FALLBACK_COLOR_PREFIX}${key}`;
}

function resolveColor(groupMapRef, combinationKey, fallbackColor) {
  if (groupMapRef?.current && combinationKey) {
    const group = groupMapRef.current.get(combinationKey);
    if (group?.color) {
      return group.color;
    }
  }
  if (fallbackColor == null) {
    console.warn(`[noFold] fallback colour used for ${combinationKey}`);
  }
  return fallbackColor;
}

function getConnectionColor(pair) {
  for (const connection of ensureArray(pair)) {
    if (connection?.color) {
      return connection.color;
    }
  }
  return null;
}

function parseIndex(nodeId) {
  if (typeof nodeId !== "string") return Number.NaN;
  const [, index] = nodeId.split("-");
  return Number.parseInt(index, 10);
}

function normalizeCombination(nodeA, nodeB) {
  const nodes = [nodeA, nodeB].sort();
  return {
    nodes,
    key: nodes.join(","),
  };
}

function deriveOrientation(nodeA, nodeB, orientationRef, key) {
  const stored = orientationRef?.current?.get(key);
  if (stored === "left" || stored === "right") {
    return stored;
  }

  const idxA = parseIndex(nodeA);
  const idxB = parseIndex(nodeB);
  if (Number.isNaN(idxA) || Number.isNaN(idxB)) {
    return "right";
  }

  return idxA <= idxB ? "right" : "left";
}

function classifyConnection(connection) {
  const topNodes = [];
  const bottomNodes = [];

  for (const node of ensureArray(connection?.nodes)) {
    if (typeof node !== "string") continue;
    if (node.startsWith("top-")) {
      topNodes.push(node);
    } else if (node.startsWith("bottom-")) {
      bottomNodes.push(node);
    }
  }

  return {
    top: topNodes[0] ?? null,
    bottom: bottomNodes[0] ?? null,
  };
}

function buildHorizontalEdge(nodeA, nodeB, orientationRef, groupMapRef, combinationKey, fallbackColor) {
  if (!nodeA || !nodeB) {
    return null;
  }

  const { nodes, key } = normalizeCombination(nodeA, nodeB);
  const orientation = deriveOrientation(nodeA, nodeB, orientationRef, key);

  let color = resolveColor(groupMapRef, combinationKey ?? key, fallbackColor);
  color = ensureColor(color, key);

  const [first, second] = nodes;
  const from = orientation === "right" ? first : second;
  const to = orientation === "right" ? second : first;

  return {
    id: key,
    nodes,
    color,
    orientation,
    from,
    to,
  };
}

function gatherHorizontalEdges(connectionPairs, latestPair, topOrientation, botOrientation, groupMapRef) {
  const pairs = ensureArray(connectionPairs).slice();
  if (
    Array.isArray(latestPair) &&
    latestPair.length === 2 &&
    pairs[pairs.length - 1] !== latestPair
  ) {
    pairs.push(latestPair);
  }

  const topEdges = [];
  const bottomEdges = [];

  for (const pair of pairs) {
    if (!Array.isArray(pair) || pair.length !== 2) {
      continue;
    }

    const [firstConnection, secondConnection] = pair;
    const { top: top1, bottom: bottom1 } = classifyConnection(firstConnection);
    const { top: top2, bottom: bottom2 } = classifyConnection(secondConnection);

    if (!top1 || !top2 || !bottom1 || !bottom2) {
      continue;
    }

    const topCombo = normalizeCombination(top1, top2);
    const botCombo = normalizeCombination(bottom1, bottom2);
    const pairColor = getConnectionColor(pair);

    const topGroup = groupMapRef?.current?.get(topCombo.key) ?? null;
    const bottomGroup = groupMapRef?.current?.get(botCombo.key) ?? null;
    const mergedColor =
      bottomGroup?.color ??
      topGroup?.color ??
      pairColor;

    const topEdge = buildHorizontalEdge(
      top1,
      top2,
      topOrientation,
      groupMapRef,
      topCombo.key,
      mergedColor
    );
    if (topEdge) {
      topEdges.push(topEdge);
    }

    const bottomEdge = buildHorizontalEdge(
      bottom1,
      bottom2,
      botOrientation,
      groupMapRef,
      botCombo.key,
      mergedColor
    );
    if (bottomEdge) {
      bottomEdges.push(bottomEdge);
    }
  }

  const debugEnabled =
    (typeof process !== "undefined" && process?.env?.NOFOLD_DEBUG) ||
    (typeof globalThis !== "undefined" && globalThis.__NOFOLD_DEBUG);

  if (debugEnabled) {
    console.log("[noFold] gathered edges", {
      latestPair,
      topEdges,
      bottomEdges,
    });
  }

  return { topEdges, bottomEdges };
}

function recordFold(foldSet, edgeId) {
  if (!edgeId) return;
  foldSet.add(edgeId);
}

function checkSequence(edges, sequenceName) {
  const foldEdges = new Set();
  const colorMap = new Map(); // color -> { outgoing, incoming }

  for (const edge of ensureArray(edges)) {
    if (!edge || !edge.from || !edge.to) {
      continue;
    }

    const color = edge.color ?? `${FALLBACK_COLOR_PREFIX}${edge.id ?? "unknown"}`;
    if (!colorMap.has(color)) {
      colorMap.set(color, {
        outgoing: new Map(), // from -> { to, id }
        incoming: new Map(), // to -> { from, id }
      });
    }

    const { outgoing, incoming } = colorMap.get(color);
    const { from, to } = edge;
    const edgeId = edge.id ?? `${from},${to}`;

    if (outgoing.has(from)) {
      const existing = outgoing.get(from);
      if (existing.to !== to) {
        console.log(
          `Fold detected in ${sequenceName}: ${from} has ${color} going to both ${existing.to} and ${to}`
        );
        recordFold(foldEdges, edgeId);
        recordFold(foldEdges, existing.id);
      }
    } else {
      outgoing.set(from, { to, id: edgeId });
    }

    if (incoming.has(to)) {
      const existing = incoming.get(to);
      if (existing.from !== from) {
        console.log(
          `Fold detected in ${sequenceName}: ${to} receives ${color} from both ${existing.from} and ${from}`
        );
        recordFold(foldEdges, edgeId);
        recordFold(foldEdges, existing.id);
      }
    } else {
      incoming.set(to, { from, id: edgeId });
    }

    if (outgoing.has(to)) {
      const reverse = outgoing.get(to);
      if (reverse.to === from) {
        console.log(
          `Cycle detected in ${sequenceName}: ${from} <-> ${to} with color ${color}`
        );
        recordFold(foldEdges, edgeId);
        recordFold(foldEdges, reverse.id);
      }
    }
  }

  return foldEdges;
}

export function noFold(latestPair, context = {}) {
  const {
    connectionPairs,
    topOrientation,
    botOrientation,
    groupMapRef,
    foldsFound,
  } = context;

  if (
    !Array.isArray(connectionPairs) &&
    !(Array.isArray(latestPair) && latestPair.length === 2)
  ) {
    foldsFound?.clear?.();
    return { ok: true };
  }

  const { topEdges, bottomEdges } = gatherHorizontalEdges(
    connectionPairs,
    latestPair,
    topOrientation,
    botOrientation,
    groupMapRef
  );

  const topFolds = checkSequence(topEdges, "top");
  const bottomFolds = checkSequence(bottomEdges, "bottom");
  const allFolds = new Set([...topFolds, ...bottomFolds]);

  if (foldsFound) {
    foldsFound.clear();
    for (const fold of allFolds) {
      foldsFound.add(fold);
    }
  }

  if (allFolds.size > 0) {
    return { ok: false, message: "No-Fold condition failed!" };
  }

  return { ok: true };
}

export function noFoldFromPatternLog(patternLog, foldsFound, options = {}) {
  if (!patternLog) {
    foldsFound?.clear?.();
    return { ok: true };
  }

  const { groupMapRef = null } = options;

  const normalise = (sequence) =>
    ensureArray(sequence).map((edge) => {
      const normalised = { ...edge };
      const nodes = ensureArray(normalised.nodes);
      if (nodes.length === 2) {
        const { nodes: sortedNodes, key } = normalizeCombination(nodes[0], nodes[1]);
        normalised.id = normalised.id ?? key;
        normalised.nodes = sortedNodes;
        const orientation = normalised.orientation === "left" ? "left" : "right";
        normalised.orientation = orientation;
        const color = ensureColor(
          resolveColor(groupMapRef, normalised.id, normalised.color),
          normalised.id
        );
        normalised.color = color;
        const [first, second] = sortedNodes;
        normalised.from = orientation === "right" ? first : second;
        normalised.to = orientation === "right" ? second : first;
      }
      return normalised;
    });

  const topEdges = normalise(patternLog.topSequence);
  const bottomEdges = normalise(patternLog.bottomSequence);

  const topFolds = checkSequence(topEdges, "top");
  const bottomFolds = checkSequence(bottomEdges, "bottom");
  const allFolds = new Set([...topFolds, ...bottomFolds]);

  if (foldsFound) {
    foldsFound.clear();
    for (const fold of allFolds) {
      foldsFound.add(fold);
    }
  }

  if (allFolds.size > 0) {
    return { ok: false, message: "No-Fold condition failed!" };
  }

  return { ok: true };
}
