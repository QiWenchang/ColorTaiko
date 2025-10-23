#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

import { generateColor } from "../src/utils/colorUtils.js";
import {
  getChecksForLevel,
  levelDescriptions,
} from "../src/utils/levels.js";
import { buildPairKey, rebuildPatternLog } from "../src/utils/patternLog.js";
import { checkAndGroupConnections } from "../src/utils/MergeUtils.js";

const LEVEL_RULE_LABELS = {
  "Level 1": [],
  "Level 2": ["orientation"],
  "Level 3.NF": ["orientation", "noFold"],
  "Level 3.G4": ["orientation", "girth(4)"],
  "Level 4.NF+NP": ["orientation", "noFold", "noPattern"],
  "Level 4.G4": ["orientation", "noFold", "noPattern", "girth(4)"],
  "Level 5.NP+G4": ["orientation", "noFold", "noPattern", "girth(4)"],
  "Level 5.NP+G6": ["orientation", "noFold", "noPattern", "girth(6)"],
};

function stripBom(text) {
  if (typeof text === "string" && text.charCodeAt(0) === 0xfeff) {
    return text.slice(1);
  }
  return text;
}

function mapToObject(map) {
  return Object.fromEntries(
    [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  );
}

function snapshotPatternLog(patternLog) {
  const simplify = (sequence) =>
    sequence.map(({ id, nodes, color, orientation, pairId }) => ({
      id,
      pairId,
      nodes: [...nodes],
      color,
      orientation,
    }));
  return {
    topSequence: simplify(patternLog.topSequence || []),
    bottomSequence: simplify(patternLog.bottomSequence || []),
  };
}

function snapshotGroups(groups) {
  return groups.map((group, index) => ({
    index,
    color: group.color,
    nodes: [...group.nodes],
    combinations: Array.from(group.combinations || []),
    pairCount: group.pairs.length,
  }));
}

function normalizeScenario(rawScenario, fallbackLevel) {
  if (!rawScenario || typeof rawScenario !== "object") {
    throw new Error("Scenario must be an object with { level, pairs }");
  }

  const level = rawScenario.level || fallbackLevel;
  if (!level) {
    throw new Error("Missing level. Provide it in the scenario or via --level.");
  }

  const sequenceSource =
    rawScenario.pairs || rawScenario.sequence || rawScenario.steps;

  if (!Array.isArray(sequenceSource)) {
    throw new Error("Scenario must include a 'pairs' (or 'sequence') array.");
  }

  const pairs = sequenceSource.map((pair, index) => normalizePair(pair, index));

  return { level, pairs };
}

function normalizePair(pair, index) {
  const raw = Array.isArray(pair)
    ? pair
    : Array.isArray(pair?.connections)
    ? pair.connections
    : Array.isArray(pair?.edges)
    ? pair.edges
    : null;

  if (!raw || raw.length !== 2) {
    throw new Error(
      `Pair #${index + 1} must describe exactly two vertical connections.`
    );
  }

  const label = typeof pair === "object" && !Array.isArray(pair)
    ? pair.label || pair.id || null
    : null;

  const edges = raw.map((connection, edgeIndex) =>
    normalizeConnection(connection, index, edgeIndex)
  );

  return { label, edges };
}

function normalizeConnection(connection, pairIndex, edgeIndex) {
  const nodesSource = Array.isArray(connection)
    ? connection
    : Array.isArray(connection?.nodes)
    ? connection.nodes
    : typeof connection === "object" && connection !== null
    ? [connection.top, connection.bottom]
    : null;

  if (!nodesSource || nodesSource.length !== 2) {
    throw new Error(
      `Pair #${pairIndex + 1}, connection #${edgeIndex + 1} must specify two nodes.`
    );
  }

  return { nodes: ensureTopBottom(nodesSource, pairIndex, edgeIndex) };
}

function ensureTopBottom(nodes, pairIndex, edgeIndex) {
  const [nodeA, nodeB] = nodes.map((node) => {
    if (typeof node !== "string") {
      throw new Error(
        `Pair #${pairIndex + 1}, connection #${edgeIndex + 1} contains a non-string node identifier.`
      );
    }
    return node.trim();
  });

  const isTopA = nodeA.startsWith("top");
  const isBottomA = nodeA.startsWith("bottom");
  const isTopB = nodeB.startsWith("top");
  const isBottomB = nodeB.startsWith("bottom");

  if (isTopA && isBottomB) return [nodeA, nodeB];
  if (isTopB && isBottomA) return [nodeB, nodeA];

  throw new Error(
    `Pair #${pairIndex + 1}, connection #${edgeIndex + 1} must connect one top node and one bottom node. Got "${nodeA}" & "${nodeB}".`
  );
}

function createInitialState() {
  return {
    connections: [],
    connectionPairs: [],
    connectionGroups: [],
    groupMapRef: { current: new Map() },
    topOrientation: { current: new Map() },
    botOrientation: { current: new Map() },
    patternLog: { topSequence: [], bottomSequence: [] },
    processedPairKeys: new Set(),
    currentColorIndex: 0,
    topRowCount: 1,
    bottomRowCount: 1,
    foldsFound: new Set(),
  };
}

function createSetter(state, key) {
  return (valueOrUpdater) => {
    if (typeof valueOrUpdater === "function") {
      state[key] = valueOrUpdater(state[key]);
    } else {
      state[key] = valueOrUpdater;
    }
  };
}

function addConnectionToState(state, connection) {
  state.connections.push(connection);
  const lastPair = state.connectionPairs[state.connectionPairs.length - 1];
  if (lastPair && lastPair.length === 1) {
    lastPair.push(connection);
  } else if (!lastPair || lastPair.length === 2) {
    state.connectionPairs.push([connection]);
  } else {
    throw new Error("Inconsistent pair state detected while adding connection.");
  }
}

function updateRowCounts(state) {
  if (!Array.isArray(state.connections) || state.connections.length === 0) {
    return;
  }

  const allTopConnected = Array.from(
    { length: state.topRowCount },
    (_, i) => state.connections.some((conn) => conn.nodes.includes(`top-${i}`))
  ).every(Boolean);

  const allBottomConnected = Array.from(
    { length: state.bottomRowCount },
    (_, i) => state.connections.some((conn) => conn.nodes.includes(`bottom-${i}`))
  ).every(Boolean);

  if (allTopConnected || allBottomConnected) {
    if (allTopConnected) {
      state.topRowCount += 1;
    } else {
      state.bottomRowCount += 1;
    }
  }
}

function createStepSnapshot(state) {
  return {
    connections: state.connections.slice(),
    connectionPairs: state.connectionPairs.map((pair) => pair.slice()),
    topOrientation: new Map(state.topOrientation.current),
    botOrientation: new Map(state.botOrientation.current),
    topRowCount: state.topRowCount,
    bottomRowCount: state.bottomRowCount,
    currentColorIndex: state.currentColorIndex,
    foldsFound: new Set(state.foldsFound),
  };
}

function restoreState(state, snapshot) {
  state.connections = snapshot.connections.slice();
  state.connectionPairs = snapshot.connectionPairs.map((pair) => pair.slice());
  state.topOrientation.current = new Map(snapshot.topOrientation);
  state.botOrientation.current = new Map(snapshot.botOrientation);
  state.topRowCount = snapshot.topRowCount;
  state.bottomRowCount = snapshot.bottomRowCount;
  state.currentColorIndex = snapshot.currentColorIndex;
  state.foldsFound.clear();
  snapshot.foldsFound.forEach((value) => state.foldsFound.add(value));
}

function runChecks(level, latestPair, context) {
  const rawChecks = getChecksForLevel(level);
  const labels = LEVEL_RULE_LABELS[level] || [];
  const steps = [];
  let ok = true;

  rawChecks.forEach((check, index) => {
    if (!ok) return;
    const label =
      labels[index] || check.name || `check-${index + 1}`;
    const result = check(latestPair, context) || { ok: true };
    const passed = result.ok !== false;
    steps.push({
      label,
      ok: passed,
      message: passed ? null : result.message || null,
    });
    if (!passed) {
      ok = false;
    }
  });

  return { ok, steps };
}

function finalizePair(
  state,
  latestPair,
  setConnections,
  setConnectionGroups
) {
  checkAndGroupConnections(
    latestPair,
    state.groupMapRef,
    setConnectionGroups,
    state.connections,
    setConnections,
    state.connectionPairs
  );

  rebuildPatternLog(
    state.patternLog,
    state.connectionPairs,
    state.topOrientation,
    state.botOrientation
  );
}

function replaySequence(rawScenario, options = {}) {
  const { stopOnFailure = true, verbose = false } = options;
  const scenario = normalizeScenario(rawScenario, options.level);

  if (!LEVEL_RULE_LABELS[scenario.level]) {
    const available = Object.keys(LEVEL_RULE_LABELS).join(", ");
    throw new Error(
      `Unknown level "${scenario.level}". Available levels: ${available}`
    );
  }

  const state = createInitialState();
  const setConnections = createSetter(state, "connections");
  const setConnectionGroups = createSetter(state, "connectionGroups");
  const steps = [];

  const originalDebug = console.debug;
  if (!verbose) {
    console.debug = () => {};
  }

  try {
    scenario.pairs.forEach((pairSpec, pairIndex) => {
      const hasFailure = steps.some((step) => step.ok === false);
      if (hasFailure && stopOnFailure) {
        return;
      }

      const snapshot = createStepSnapshot(state);

      const color = generateColor(
        state.currentColorIndex,
        (nextIndex) => {
          state.currentColorIndex = nextIndex;
        },
        state.connectionPairs
      );

      const connectionA = {
        nodes: [...pairSpec.edges[0].nodes],
        color,
      };
      addConnectionToState(state, connectionA);
      updateRowCounts(state);

      const connectionB = {
        nodes: [...pairSpec.edges[1].nodes],
        color,
      };
      addConnectionToState(state, connectionB);
      updateRowCounts(state);

      const latestPair =
        state.connectionPairs[state.connectionPairs.length - 1];
      if (!latestPair || latestPair.length !== 2) {
        throw new Error(
          `Internal error: connection pair #${pairIndex + 1} is incomplete.`
        );
      }

      const context = {
        groupMapRef: state.groupMapRef,
        topOrientation: state.topOrientation,
        botOrientation: state.botOrientation,
        connections: state.connections,
        connectionPairs: state.connectionPairs,
        topRowCount: state.topRowCount,
        bottomRowCount: state.bottomRowCount,
        patternLog: state.patternLog,
        foldsFound: state.foldsFound,
      };

      const pairId = buildPairKey(latestPair) || `pair-${pairIndex}`;
      const checkResults = runChecks(scenario.level, latestPair, context);
      const folds = state.foldsFound.size
        ? Array.from(state.foldsFound)
        : [];

      const stepRecord = {
        index: pairIndex + 1,
        inputLabel: pairSpec.label,
        pairId,
        nodes: latestPair.map((conn) => [...conn.nodes]),
        color: latestPair[0]?.color ?? null,
        checks: checkResults.steps,
        ok: checkResults.ok,
        folds,
      };

      if (!checkResults.ok) {
        if (verbose) {
          stepRecord.stateAfter = {
            topOrientation: mapToObject(state.topOrientation.current),
            botOrientation: mapToObject(state.botOrientation.current),
            patternLog: snapshotPatternLog(state.patternLog),
            groups: snapshotGroups(state.connectionGroups),
          };
        }
        steps.push(stepRecord);
        restoreState(state, snapshot);
        return;
      }

      state.processedPairKeys.add(pairId);
      finalizePair(
        state,
        latestPair,
        setConnections,
        setConnectionGroups
      );

      stepRecord.color = latestPair[0]?.color ?? stepRecord.color;

      if (verbose) {
        stepRecord.stateAfter = {
          topOrientation: mapToObject(state.topOrientation.current),
          botOrientation: mapToObject(state.botOrientation.current),
          patternLog: snapshotPatternLog(state.patternLog),
          groups: snapshotGroups(state.connectionGroups),
        };
      }

      steps.push(stepRecord);
    });

    const finalState = {
      topOrientation: mapToObject(state.topOrientation.current),
      botOrientation: mapToObject(state.botOrientation.current),
      patternLog: snapshotPatternLog(state.patternLog),
      groups: snapshotGroups(state.connectionGroups),
      connectionPairs: state.connectionPairs.map((pair) =>
        pair.map((conn) => ({
          nodes: [...conn.nodes],
          color: conn.color,
        }))
      ),
    };

    return {
      level: scenario.level,
      steps,
      finalState,
    };
  } finally {
    console.debug = originalDebug;
  }
}

function formatStepSummary(step) {
  const pairLabel = step.nodes
    .map(([topNode, bottomNode]) => `${topNode}->${bottomNode}`)
    .join(" , ");
  const status = step.ok ? "OK" : "FAIL";
  const labelSuffix = step.inputLabel ? ` (${step.inputLabel})` : "";
  return `#${step.index}${labelSuffix}: ${pairLabel} [${status}]`;
}

function formatCheckSummary(check) {
  const status = check.ok ? "ok" : "fail";
  const message = check.message ? ` :: ${check.message}` : "";
  return `  - ${status.padEnd(4)} ${check.label}${message}`;
}

function loadScenarioFromSpec(spec) {
  if (!spec) return {};
  const resolved = path.resolve(process.cwd(), spec);
  if (fs.existsSync(resolved)) {
    const content = fs.readFileSync(resolved, "utf8");
    return JSON.parse(stripBom(content));
  }
  return JSON.parse(stripBom(spec));
}

function printHumanReadable(result) {
  console.log(`Level: ${result.level}`);
  console.log(
    `Constraints: ${(levelDescriptions[result.level] || []).join(", ")}`
  );
  if (result.steps.length === 0) {
    console.log("No connection pairs processed.");
    return;
  }

  result.steps.forEach((step) => {
    console.log(formatStepSummary(step));
    step.checks.forEach((check) => {
      console.log(formatCheckSummary(check));
    });
    if (step.folds && step.folds.length > 0) {
      console.log(`  - folds: ${step.folds.join(", ")}`);
    }
    if (step.stateAfter) {
      console.log(
        `  - topOrientation: ${JSON.stringify(
          step.stateAfter.topOrientation
        )}`
      );
      console.log(
        `  - botOrientation: ${JSON.stringify(
          step.stateAfter.botOrientation
        )}`
      );
    }
  });

  const failedStep = result.steps.find((step) => !step.ok);
  if (!failedStep) {
    console.log("All checks passed.");
  } else {
    const reason =
      failedStep.checks.find((check) => !check.ok)?.label ||
      "validation failure";
    const hasPostFailureSteps = result.steps.some(
      (step) => step.index > failedStep.index
    );
    if (hasPostFailureSteps) {
      console.log(
        `Failure at step #${failedStep.index} due to ${reason}, continued processing remaining steps.`
      );
    } else {
      console.log(
        `Stopped at step #${failedStep.index} due to ${reason}.`
      );
    }
  }
}

function main(argv) {
  const { values, positionals } = parseArgs({
    options: {
      level: { type: "string" },
      scenario: { type: "string", short: "s" },
      pairs: { type: "string", short: "p" },
      continue: { type: "boolean", short: "c" },
      verbose: { type: "boolean", short: "v" },
      json: { type: "boolean", short: "j" },
    },
    allowPositionals: true,
    argv,
  });

  const scenarioSpec =
    values.scenario || positionals[0] || null;

  let scenario = scenarioSpec ? loadScenarioFromSpec(scenarioSpec) : {};
  if (values.level) {
    scenario.level = values.level;
  }
  if (values.pairs) {
    try {
      scenario.pairs = JSON.parse(values.pairs);
    } catch (parseError) {
      throw new Error(
        "Failed to parse --pairs JSON. Ensure it is a valid JSON array."
      );
    }
  }

  const result = replaySequence(scenario, {
    level: values.level,
    stopOnFailure: !values.continue,
    verbose: values.verbose,
  });

  if (values.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHumanReadable(result);
  }
}

const executedFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === executedFile) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

export { replaySequence };
