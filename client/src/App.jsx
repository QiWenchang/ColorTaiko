import { useState, useRef, useEffect } from "react";

import { generateColor } from "./utils/colorUtils";
import { drawConnections } from "./utils/drawingUtils";
import { checkAndGroupConnections } from "./utils/MergeUtils";
import { calculateProgress } from "./utils/calculateProgress";
import { checkAndAddNewNodes } from "./utils/checkAndAddNewNodes";
import { getConnectedNodes } from "./utils/getConnectedNodes";
import { checkOrientation } from "./utils/checkOrientation";

import SettingIconImage from "./assets/setting-icon.png";

import TaikoNode from "./components/TaikoNodes/TaikoNode";
import ErrorModal from "./components/ErrorModal";
import SettingsMenu from "./components/ToolMenu/settingMenu";
import ProgressBar from "./components/ProgressBar/progressBar";
import Title from "./components/title";
import { useAudio } from "./hooks/useAudio";
import { useSettings } from "./hooks/useSetting";

function App() {
  // Game state management
  const [topRowCount, setTopRowCount] = useState(1);
  const [bottomRowCount, setBottomRowCount] = useState(1);
  const [showNodes] = useState(true);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [connectionPairs, setConnectionPairs] = useState([]);
  const [connectionGroups, setConnectionGroups] = useState([]);
  const [edgeState, setEdgeState] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentColor, setCurrentColor] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const svgRef = useRef(null);
  const groupMapRef = useRef(new Map());
  const previousProgressRef = useRef(progress);
  const [highlightedNodes, setHighlightedNodes] = useState([]);
  const topOrientation = useRef(new Map());
  const botOrientation = useRef(new Map());

  const [isDraggingLine, setIsDraggingLine] = useState(false);
  const [startNode, setStartNode] = useState(null);
  const [currentLineEl, setCurrentLineEl] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [level, setLevel] = useState("level");

  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isDropdownDisabled, setIsDropdownDisabled] = useState(false);

  const [history, setHistory] = useState([
    {
      connections: [],
      connectionPairs: [],
      connectionGroups: [],
      topRowCount: 1,
      bottomRowCount: 1,
      edgeState: null,
      groupMap: new Map(),
      topOrientationMap: new Map(),
      botOrientationMap: new Map(),
    },
  ]);
  const [currentStep, setCurrentStep] = useState(0);

  // Instead of a single log ref, we maintain two:
  // one for active connections and another for undone connections.
  const activeConnectionLogRef = useRef([]);
  const undoneConnectionLogRef = useRef([]);

  const handleLevelChange = (event) => {
    setSelectedLevel(event.target.value);
    setLevel(event.target.value);
    setIsDropdownDisabled(true); // Disable dropdown after selection.
  };

  // Custom hooks for managing audio and settings.
  const { clickAudio, errorAudio, connectsuccess, perfectAudio } = useAudio();
  const {
    offset,
    setOffset,
    soundBool,
    setSoundBool,
    blackDotEffect,
    setBlackDotEffect,
    lightMode,
    setLightMode,
  } = useSettings();

  // References for SVG elements and connection groups.
  const [showSettings, setShowSettings] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(false);
  const [Percent100Message, setPercent100Message] = useState(false);

  // Function to save current state to history.
  const saveToHistory = () => {
    const newState = {
      connections: structuredClone(connections),
      connectionPairs: structuredClone(connectionPairs),
      connectionGroups: structuredClone(connectionGroups),
      topRowCount,
      bottomRowCount,
      edgeState,
      groupMap: structuredClone(groupMapRef.current),
      topOrientationMap: structuredClone(topOrientation.current),
      botOrientationMap: structuredClone(botOrientation.current),
    };

    setHistory([...history, newState]);
    setCurrentStep(currentStep + 1);
  };

  // Updated handleUndo function with console logging before and after undo.
  const handleUndo = () => {
    if (currentStep > 0) {
      console.log("Before undo:");
      console.log("connections:", connections);
      console.log("connectionPairs:", connectionPairs);
      console.log("connectionGroups:", connectionGroups);
      console.log(
        "topRowCount:",
        topRowCount,
        "bottomRowCount:",
        bottomRowCount
      );
      console.log("edgeState:", edgeState);
      console.log("groupMap:", groupMapRef.current);
      console.log("topOrientation:", topOrientation.current);
      console.log("botOrientation:", botOrientation.current);

      const previousState = history[currentStep];

      // Restore state variables.
      setConnections(previousState.connections);
      setConnectionPairs(previousState.connectionPairs);
      setConnectionGroups(previousState.connectionGroups);
      setTopRowCount(previousState.topRowCount);
      setBottomRowCount(previousState.bottomRowCount);
      setEdgeState(previousState.edgeState);

      // Restore ref values.
      groupMapRef.current = new Map(previousState.groupMap);
      topOrientation.current = new Map(previousState.topOrientationMap);
      botOrientation.current = new Map(previousState.botOrientationMap);

      setHistory((prev) => prev.slice(0, -1));
      setCurrentStep(currentStep - 1);

      console.log("After undo (restored state):");
      console.log("connections:", previousState.connections);
      console.log("connectionPairs:", previousState.connectionPairs);
      console.log("connectionGroups:", previousState.connectionGroups);
      console.log(
        "topRowCount:",
        previousState.topRowCount,
        "bottomRowCount:",
        previousState.bottomRowCount
      );
      console.log("edgeState:", previousState.edgeState);
      console.log("groupMap:", previousState.groupMap);
      console.log("topOrientation:", previousState.topOrientationMap);
      console.log("botOrientation:", previousState.botOrientationMap);

      if (activeConnectionLogRef.current.length > 0) {
        const removedConnection = activeConnectionLogRef.current.pop();
        undoneConnectionLogRef.current.push(removedConnection);
        const activeStr = activeConnectionLogRef.current.join(", ");
        const undoneStr = undoneConnectionLogRef.current
          .map((conn) => "UNDID " + conn)
          .join(", ");
        console.log(
          `Updated connection order: ${activeStr}${
            activeStr && undoneStr ? ", " : ""
          }${undoneStr}`
        );
      }
    }
  };

  /**
   * Sets welcome message visibility based on the number of nodes in each row.
   */
  useEffect(() => {
    if (topRowCount === 1 && bottomRowCount === 1) {
      setWelcomeMessage(true);
    }
  }, [topRowCount, bottomRowCount]);

  /**
   * Draws connections on the SVG element when related state changes.
   */
  useEffect(() => {
    drawConnections(
      svgRef,
      connections,
      connectionPairs,
      offset,
      topOrientation,
      botOrientation
    );
  }, [
    connectionGroups,
    connections,
    topRowCount,
    bottomRowCount,
    connectionPairs,
    offset,
  ]);

  /**
   * Checks if new nodes should be added based on current connections.
   */
  useEffect(() => {
    checkAndAddNewNodes(
      topRowCount,
      bottomRowCount,
      connections,
      setTopRowCount,
      setBottomRowCount
    );
  }, [connections, topRowCount, bottomRowCount]);

  /**
   * Calculates progress as a percentage based on completed connections.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      const newProgress = calculateProgress(
        connections,
        topRowCount,
        bottomRowCount
      );
      setProgress(newProgress);

      if (newProgress === 100) {
        setPercent100Message(true);
        if (soundBool) {
          perfectAudio.play();
        }
      } else if (newProgress > previousProgressRef.current && soundBool) {
        connectsuccess.play();
      }

      previousProgressRef.current = newProgress;
    }, 100);

    return () => clearTimeout(timer);
  }, [connections, topRowCount, bottomRowCount]);

  /**
   * Handles window resize events to redraw connections.
   */
  useEffect(() => {
    const handleResize = () => {
      drawConnections(svgRef, connections, connectionPairs, offset);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [svgRef, connections, connectionPairs, offset]);

  /**
   * Updates the temporary dragging line on mouse move.
   */
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingLine && currentLineEl) {
        const svgRect = svgRef.current.getBoundingClientRect();
        const mouseX = e.clientX - svgRect.left;
        const mouseY = e.clientY - svgRect.top;
        currentLineEl.setAttribute("x2", mouseX);
        currentLineEl.setAttribute("y2", mouseY);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isDraggingLine, currentLineEl]);

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDraggingLine && !selectedNodes[1]) {
        if (currentLineEl && svgRef.current.contains(currentLineEl)) {
          svgRef.current.removeChild(currentLineEl);
        }
        setIsDraggingLine(false);
        setStartNode(null);
        setCurrentLineEl(null);
      }
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [isDraggingLine, currentLineEl, selectedNodes]);

  /**
   * Groups connections when a new connection pair is completed.
   */
  useEffect(() => {
    const latestPair = connectionPairs[connectionPairs.length - 1];
    if (latestPair && latestPair.length === 2) {
      if (level === "Level 2") {
        const a = checkOrientation(
          latestPair,
          groupMapRef,
          topOrientation,
          botOrientation
        );
        if (a === -1) {
          setErrorMessage("Orientation condition failed!");
          setSelectedNodes([]);
          handleUndo();
          return;
        }
      }

      checkAndGroupConnections(
        latestPair,
        groupMapRef,
        setConnectionGroups,
        connections,
        setConnections,
        connectionPairs
      );
    }
    console.log("topOrientation", topOrientation);
    console.log("botOrientation", botOrientation);
    console.log("groupMapRef", groupMapRef);
  }, [connectionPairs]);

  const createTopRow = (count) =>
    Array.from({ length: count }, (_, i) => (
      <TaikoNode
        key={`top-${i}`}
        id={`top-${i}`}
        onClick={() => handleNodeClick(`top-${i}`)}
        isSelected={selectedNodes.includes(`top-${i}`)}
        index={i}
        totalCount={topRowCount}
        isFaded={count > 1 && i === count - 1}
        position="top"
        blackDotEffect={blackDotEffect}
        lightMode={lightMode}
        isHighlighted={highlightedNodes.includes(`top-${i}`)}
      />
    ));

  const createBottomRow = (count) =>
    Array.from({ length: count }, (_, i) => (
      <TaikoNode
        key={`bottom-${i}`}
        id={`bottom-${i}`}
        onClick={() => handleNodeClick(`bottom-${i}`)}
        isSelected={selectedNodes.includes(`bottom-${i}`)}
        index={i}
        totalCount={bottomRowCount}
        isFaded={count > 1 && i === count - 1}
        position="bottom"
        blackDotEffect={blackDotEffect}
        lightMode={lightMode}
        isHighlighted={highlightedNodes.includes(`bottom-${i}`)}
      />
    ));

  // Updated node click handler to avoid duplicate tryConnect calls.
  const handleNodeClick = (nodeId) => {
    setErrorMessage("");

    if (soundBool) clickAudio.play();

    if (!selectedLevel) {
      setErrorMessage("Please select a level and try again!!!!");
      return;
    }

    // Deselect if node is already selected.
    if (selectedNodes.includes(nodeId)) {
      setSelectedNodes(selectedNodes.filter((id) => id !== nodeId));
      setHighlightedNodes([]);
      return;
    }

    const newSelectedNodes = [...selectedNodes, nodeId];
    setSelectedNodes(newSelectedNodes);

    if (newSelectedNodes.length === 1) {
      const connectedNodes = getConnectedNodes(nodeId, connectionPairs);
      setHighlightedNodes(connectedNodes);
      setIsDraggingLine(true);
      setStartNode(nodeId);

      const nodeElem = document.getElementById(nodeId);
      const nodeRect = nodeElem.getBoundingClientRect();
      const svgRect = svgRef.current.getBoundingClientRect();
      const startX = nodeRect.left + nodeRect.width / 2 - svgRect.left;
      const startY = nodeRect.top + nodeRect.height / 2 - svgRect.top;

      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", startX);
      line.setAttribute("y1", startY);
      line.setAttribute("x2", startX);
      line.setAttribute("y2", startY);
      line.setAttribute("stroke", "gray");
      line.setAttribute("stroke-width", "2");
      line.setAttribute("stroke-dasharray", "5,5");

      svgRef.current.appendChild(line);
      setCurrentLineEl(line);
    } else if (newSelectedNodes.length === 2) {
      if (currentLineEl && svgRef.current.contains(currentLineEl)) {
        svgRef.current.removeChild(currentLineEl);
      }
      setIsDraggingLine(false);
      setStartNode(null);
      tryConnect(newSelectedNodes);
      setSelectedNodes([]);
      setHighlightedNodes([]);
    }
  };

  const handleToolMenuClick = () => setShowSettings((prev) => !prev);

  const handleClear = () => {
    setConnectionPairs([]);
    setConnections([]);
    setSelectedNodes([]);
    setBottomRowCount(1);
    setTopRowCount(1);
    setEdgeState(null);
    setErrorMessage("");
    setProgress(0);
    setConnectionGroups([]);
    setCurrentColor(0);
    groupMapRef.current.clear();
    topOrientation.current.clear();
    botOrientation.current.clear();

    // Reset history and both connection logs.
    setHistory([
      {
        connections: [],
        connectionPairs: [],
        connectionGroups: [],
        topRowCount: 1,
        bottomRowCount: 1,
        edgeState: null,
        groupMap: new Map(),
        topOrientationMap: new Map(),
        botOrientationMap: new Map(),
      },
    ]);
    setCurrentStep(0);
    activeConnectionLogRef.current = [];
    undoneConnectionLogRef.current = [];
  };

  const handleSoundClick = () => {
    setSoundBool((prev) => !prev);
  };

  const handleOffsetChange = (newOffset) => {
    setOffset(newOffset);
    localStorage.setItem("offset", newOffset);
  };

  const toggleBlackDotEffect = () => {
    setBlackDotEffect((prev) => !prev);
  };

  const toggleLightMode = () => {
    setLightMode((prevMode) => !prevMode);
  };

  const tryConnect = (nodes) => {
    if (nodes.length !== 2) return;
    let [node1, node2] = nodes;

    const isTopNode = (id) => id.startsWith("top");
    const isBottomNode = (id) => id.startsWith("bottom");

    if (isBottomNode(node1) && isTopNode(node2)) {
      [node1, node2] = [node2, node1];
    }

    if (
      (isTopNode(node1) && isTopNode(node2)) ||
      (isBottomNode(node1) && isBottomNode(node2))
    ) {
      if (soundBool) errorAudio.play();
      setErrorMessage("Can't connect two vertices from the same row.");
      setSelectedNodes([]);
      return;
    }

    const isDuplicate = connections.some(
      (conn) =>
        (conn.nodes.includes(node1) && conn.nodes.includes(node2)) ||
        (conn.nodes.includes(node2) && conn.nodes.includes(node1))
    );
    if (isDuplicate) {
      if (soundBool) errorAudio.play();
      setErrorMessage("These vertices are already connected.");
      setSelectedNodes([]);
      return;
    }

    if (
      edgeState &&
      (edgeState.nodes.includes(node1) || edgeState.nodes.includes(node2))
    ) {
      if (soundBool) errorAudio.play();
      setErrorMessage(
        "Two vertical edges in each pair should not share a common vertex"
      );
      setSelectedNodes([]);
      return;
    }

    // Save current state before updating.
    saveToHistory();

    let newColor;
    if (edgeState) {
      newColor = edgeState.color;
      const newConnection = {
        nodes: [node1, node2],
        color: newColor,
      };
      setConnections([...connections, newConnection]);
      setConnectionPairs((prevPairs) => {
        const lastPair = prevPairs[prevPairs.length - 1];
        let updatedPairs;
        if (lastPair && lastPair.length === 1) {
          updatedPairs = [
            ...prevPairs.slice(0, -1),
            [...lastPair, newConnection],
          ];
        } else {
          updatedPairs = [...prevPairs, [edgeState, newConnection]];
        }
        return updatedPairs;
      });
      setEdgeState(null);

      const connectionStr = `${node1} -> ${node2}`;
      activeConnectionLogRef.current.push(connectionStr);
      console.log(`Added connection: ${connectionStr}`);
      console.log(
        `Updated connection order: ${activeConnectionLogRef.current.join(", ")}`
      );
    } else {
      newColor = generateColor(currentColor, setCurrentColor, connectionPairs);
      const newConnection = {
        nodes: [node1, node2],
        color: newColor,
      };
      setConnections([...connections, newConnection]);
      setConnectionPairs([...connectionPairs, [newConnection]]);
      setEdgeState(newConnection);

      const connectionStr = `${node1} -> ${node2} (pending pair)`;
      activeConnectionLogRef.current.push(connectionStr);
      console.log(`Added connection: ${connectionStr}`);
      console.log(
        `Updated connection order: ${activeConnectionLogRef.current.join(", ")}`
      );
    }
    setSelectedNodes([]);
  };

  if (lightMode) {
    document.body.classList.add("light-mode");
  } else {
    document.body.classList.remove("light-mode");
  }

  return (
    <div className={`app-container ${lightMode ? "light-mode" : "dark-mode"}`}>
      <Title />

      <ProgressBar
        progress={progress}
        connections={connections}
        topRowCount={topRowCount}
        bottomRowCount={bottomRowCount}
        lightMode={lightMode}
      />

      {welcomeMessage && (
        <div className="welcome-message fade-message">
          Connect the vertices!
        </div>
      )}

      {Percent100Message && (
        <div className="welcome-message fade-message">You did it! 100%!</div>
      )}

      <img
        src={SettingIconImage}
        alt="Settings Icon"
        className="icon"
        onClick={() => setShowSettings((prev) => !prev)}
      />

      {showSettings && (
        <SettingsMenu
          offset={offset}
          onOffsetChange={handleOffsetChange}
          soundbool={soundBool}
          onSoundControl={handleSoundClick}
          blackDotEffect={blackDotEffect}
          onToggleBlackDotEffect={toggleBlackDotEffect}
          lightMode={lightMode}
          onToggleLightMode={toggleLightMode}
        />
      )}

      <button onClick={handleClear} className="clear-button">
        Clear
      </button>
      <button onClick={handleUndo} className="undo-button">
        Undo
      </button>
      {!selectedLevel ? (
        <div className="level-selector">
          <select
            id="level-dropdown"
            onChange={handleLevelChange}
            disabled={isDropdownDisabled}
            className="level-dropdown"
          >
            <option value="" disabled selected>
              Choose a level
            </option>
            <option value="Level 1">Level 1</option>
            <option value="Level 2">Level 2</option>
          </select>
        </div>
      ) : (
        <div
          className="level-selected"
          style={{ color: lightMode ? "black" : "white" }}
        >
          Selected Level: {selectedLevel}
        </div>
      )}

      <ErrorModal
        className="error-container"
        message={errorMessage}
        onClose={() => setErrorMessage("")}
      />

      {showNodes && (
        <div className="game-box">
          <div className="game-row">{createTopRow(topRowCount)}</div>
          <svg ref={svgRef} className="svg-overlay" />
          <div className="game-row bottom-row">
            {createBottomRow(bottomRowCount)}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
