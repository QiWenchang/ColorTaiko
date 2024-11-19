import { useState, useRef, useEffect } from "react";

import { generateColor } from "./utils/colorUtils";
import { drawConnections } from "./utils/drawingUtils";
import { checkAndGroupConnections } from "./utils/MergeUtils";
import { calculateProgress } from "./utils/calculateProgress";
import { checkAndAddNewNodes} from "./utils/checkAndAddNewNodes";

import SettingIconImage from "./assets/setting-icon.png";

import TaikoNode from "./components/TaikoNodes/TaikoNode";
import ErrorModal from "./components/ErrorModal";
import SettingsMenu from "./components/ToolMenu/settingMenu";
import ProgressBar from "./components/ProgressBar/progressBar";
import Title from "./components/title";

import { useAudio } from './hooks/useAudio';
import { useSettings } from './hooks/useSetting';



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

  // Custom hooks for managing audio and settings
  const { errorAudio, connectAudio } = useAudio();
  const { offset, setOffset, soundBool, setSoundBool, blackDotEffect, setBlackDotEffect } = useSettings();

  // References for SVG elements and connection groups
  const [showSettings, setShowSettings] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(false);

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
    drawConnections(svgRef, connections, connectionPairs, offset);
  }, [connectionGroups, connections, topRowCount, bottomRowCount, connectionPairs, offset]);

  /**
   * Checks if new nodes should be added based on current connections.
   */
  useEffect(() => {
    // console.log("Connections updated:", connections);
    drawConnections();
  }, [connections, topRowCount, bottomRowCount, connectionPairs]);
    checkAndAddNewNodes(topRowCount, bottomRowCount, connections, setTopRowCount, setBottomRowCount);
  }, [connections, topRowCount, bottomRowCount]);

  /**
   * Calculates progress as a percentage based on completed connections.
   */
  useEffect(() => {
    setProgress(calculateProgress(connections, topRowCount, bottomRowCount));
  }, [connections, topRowCount, bottomRowCount]);

  /**
   * Handles window resize events to redraw connections, ensuring layout consistency.
   */
  useEffect(() => {
    const handleResize = () => {
      drawConnections(svgRef, connections, connectionPairs, offset);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [svgRef, connections, connectionPairs, offset]);

  /**
   * Groups connections when a new connection pair is completed.
   */
  useEffect(() => {
    const latestPair = connectionPairs[connectionPairs.length - 1];
    if (latestPair && latestPair.length === 2) {
      checkAndGroupConnections(
        latestPair,
        groupMapRef,
        setConnectionGroups,
        connections,
        setConnections
      );
    }
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
      />
    ));

  const handleNodeClick = (nodeId) => {
    setErrorMessage("");
    if (soundBool) connectAudio.play();
    if (selectedNodes.includes(nodeId)) {
      setSelectedNodes(selectedNodes.filter((id) => id !== nodeId));
    } else {
      if (selectedNodes.length < 2) {
        const newSelectedNodes = [...selectedNodes, nodeId];
        setSelectedNodes(newSelectedNodes);
        if (newSelectedNodes.length === 2) {
          tryConnect(newSelectedNodes);
          // checkAndGroupConnections();
        }
      }
    } else if (selectedNodes.length < 2) {
      const newSelectedNodes = [...selectedNodes, nodeId];
      setSelectedNodes(newSelectedNodes);
      if (newSelectedNodes.length === 2) tryConnect(newSelectedNodes);
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
    console.log(connectionPairs);
  };

  const handleSoundClick = () => {
    // Toggle the soundBool
    setSoundBool((prev) => !prev);

  };

  const handleOffsetChange = (newOffset) => {
    setOffset(newOffset);
    localStorage.setItem("offset", newOffset); //store to localStorage
  };

  const toggleBlackDotEffect = () => {
    setBlackDotEffect((prev) => !prev);
  };

  const tryConnect = (nodes) => {
    if (nodes.length !== 2) return;
    const [node1, node2] = nodes;
    const isTopNode = (id) => id.startsWith("top");
    const isBottomNode = (id) => id.startsWith("bottom");

    if (
      (isTopNode(node1) && isTopNode(node2)) ||
      (isBottomNode(node1) && isBottomNode(node2))
    ) {
      if(soundBool) {
        errorAudio.play();
      }
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
      if(soundBool) {
        errorAudio.play();
      }
      setErrorMessage("These vertices are already connected.");
      setSelectedNodes([]);
      return;
    }

    if (
      edgeState &&
      (edgeState.nodes.includes(node1) || edgeState.nodes.includes(node2))
    ) {
      if(soundBool) {
        errorAudio.play();
      }
      setErrorMessage(
        "Two vertical edges in each pair should not share a common vertex"
      );
      setSelectedNodes([]);
      return;
    }

    let newColor;
    if (edgeState) {
      // If there is a pending edge, use the same color and create a pair
      newColor = edgeState.color;
      const newConnection = {
        nodes: nodes,
        color: newColor,
      };
      setConnections([...connections, newConnection]);
      setConnectionPairs((prevPairs) => {
        const lastPair = prevPairs[prevPairs.length - 1];
        let updatedPairs;
        if (lastPair && lastPair.length === 1) {
          // If the last pair has one connection, complete it
          updatedPairs = [...prevPairs.slice(0, -1), [...lastPair, newConnection]];
          updatedPairs = [
            ...prevPairs.slice(0, -1),
            [...lastPair, newConnection],
          ];
        } else {
          // Otherwise, create a new pair
          updatedPairs = [...prevPairs, [edgeState, newConnection]];
        }
        if (updatedPairs[updatedPairs.length - 1].length === 2) {
          checkAndGroupConnections();
          updatedPairs = [...prevPairs, [edgeState, newConnection]];
        }
        return updatedPairs;
  
        return updatedPairs;
      });
      console.log(connectionPairs);
      setEdgeState(null);
    } else {
      // If no pending edge, create a new edge and add to edgeState
      newColor = generateColor(currentColor, setCurrentColor);
      console.log("newColor: ", newColor);
      //console.log(newColor);
      const newConnection = {
        nodes: nodes,
        color: newColor,
      };
      setConnections([...connections, newConnection]);
      // Create a new pair and add to the connection pairs
      setConnectionPairs([...connectionPairs, [newConnection]]);
      setEdgeState(newConnection);
    }
    setSelectedNodes([]);
  };

  const drawArc = (startRect, endRect, svgRect, color, arcHeight) => {
    const midX = (startRect.left + endRect.left) / 2;
    const startY = startRect.top + startRect.height / 2 - svgRect.top;
    const endY = endRect.top + endRect.height / 2 - svgRect.top;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");

    // Modify arcHeight: negative for upward arc, positive for downward arc
    const d = `
      M ${startRect.left + startRect.width / 2 - svgRect.left}, ${startY} 
      C ${midX}, ${startY + arcHeight} ${midX}, ${endY + arcHeight} 
      ${endRect.left + endRect.width / 2 - svgRect.left}, ${endY}
    `;

    line.setAttribute("d", d.trim());
    line.setAttribute("stroke", color);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke-width", "4");


    svgRef.current.appendChild(line);
  };

  useEffect(() => {
    const handleResize = () => {
      drawConnections(); 
    };
  
    window.addEventListener('resize', handleResize);
  
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [connections, connectionPairs]);

  const drawConnections = () => {
    if (!svgRef.current) return;
  
    // Clear existing lines and curves
    while (svgRef.current.firstChild) {
      svgRef.current.removeChild(svgRef.current.firstChild);
    }
  
    // Get the latest SVG container position and size
    const svgRect = svgRef.current.getBoundingClientRect();
  
    // Draw straight line connections
    connections.forEach(({ nodes: [start, end], color }) => {
      const startElement = document.getElementById(start);
      const endElement = document.getElementById(end);
  
      if (startElement && endElement) {
        // Get the latest node positions
        const startRect = startElement.getBoundingClientRect();
        const endRect = endElement.getBoundingClientRect();
  
        // Calculate the start and end points of the line
        const startX = startRect.left + startRect.width / 2 - svgRect.left;
        const startY = startRect.top + startRect.height / 2 - svgRect.top;
        const endX = endRect.left + endRect.width / 2 - svgRect.left;
        const endY = endRect.top + endRect.height / 2 - svgRect.top;
  
        // Create a straight line
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", startX);
        line.setAttribute("y1", startY);
        line.setAttribute("x2", endX);
        line.setAttribute("y2", endY);
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", "4");
        line.setAttribute("stroke-linecap", "round");
  
        svgRef.current.appendChild(line);
      }
    });
  
    // Draw curved connections
    connectionPairs.forEach((pair) => {
      if (pair.length === 2) {
        const [
          {
            nodes: [startNode1, bottomNode1],
          },
          {
            nodes: [startNode2, bottomNode2],
            color,
          },
        ] = pair;
  
        // Determine if the node is top or bottom
        const topFirst1 = !startNode1.startsWith("bottom");
        const topFirst2 = !startNode2.startsWith("bottom");
  
        // Function to create a curved path
        const createCurvedPath = (startNode, endNode, isTopCurve) => {
          const startElement = document.getElementById(startNode);
          const endElement = document.getElementById(endNode);
          if (!startElement || !endElement) return null; // Ensure nodes exist
  
          const startRect = startElement.getBoundingClientRect();
          const endRect = endElement.getBoundingClientRect();
  
          const startX = startRect.left + startRect.width / 2 - svgRect.left;
          const startY = startRect.top + startRect.height / 2 - svgRect.top;
          const endX = endRect.left + endRect.width / 2 - svgRect.left;
          const endY = endRect.top + endRect.height / 2 - svgRect.top;
  
          const dx = endX - startX;
          const dy = endY - startY;
          const distance = Math.sqrt(dx * dx + dy * dy);
  
          const controlX = (startX + endX) / 2;
          const controlY = isTopCurve 
            ? Math.min(startY, endY) - (distance / 5)
            : Math.max(startY, endY) + (distance / 5);
  
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          const d = `M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`;
          path.setAttribute("d", d);
          path.setAttribute("stroke", color);
          path.setAttribute("fill", "none");
          path.setAttribute("stroke-width", "4");
          path.setAttribute("stroke-linecap", "round");
  
          return path;
        };
  
        // Draw the top and bottom curves
        const topCurve = createCurvedPath(
          topFirst1 ? startNode1 : bottomNode1,
          topFirst2 ? startNode2 : bottomNode2,
          true // Top curve
        );
        if (topCurve) svgRef.current.appendChild(topCurve);
  
        const bottomCurve = createCurvedPath(
          topFirst1 ? bottomNode1 : startNode1,
          topFirst2 ? bottomNode2 : startNode2,
          false // Bottom curve
        );
        if (bottomCurve) svgRef.current.appendChild(bottomCurve);
      }
    });
  };
  

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowNodes(true);
    setConnections([]);
    setSelectedNodes([]);
    setErrorMessage("");
  };

  const handleClear = () => {
    setConnectionPairs([])
    setConnections([]);
    setSelectedNodes([]);
    setBottomRowCount(1);
    setTopRowCount(1);
    setEdgeState(null);
    setErrorMessage("");
    setProgress(0);
    setConnectionGroups([]);
    console.log(connectionPairs);
  };
  
  const calculateProgress = () => {
    let totalPossibleConnections = (topRowCount - 1) *  (bottomRowCount - 1);
    if (totalPossibleConnections % 2 !== 0) {
      totalPossibleConnections -= 1;
    }
    const verticalEdges = connections.length;
    const progressPercentage = totalPossibleConnections > 4 ? (verticalEdges / totalPossibleConnections) * 100 : 0;
    setProgress(progressPercentage);
  };

  const showTooltip = (e) => {
    setTooltipVisible(true);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const hideTooltip = () => {
    setTooltipVisible(false);
  };

  useEffect(() => {
    calculateProgress();
  }, [connections, topRowCount, bottomRowCount]);
  
  const [connectionGroups, setConnectionGroups] = useState([]);

  const checkAndGroupConnections = () => {
    const groupMap = new Map(); // Stores shared {top} or {bottom} combinations
    let colorMerged = false; // Flag to indicate if a color merge occurred
    const newGroups = []; // Temporarily stores newly generated unique groups

    console.log("Current connectionPairs:", connectionPairs);

    connectionPairs.forEach((pair) => {
      if (pair.length !== 2) return; // Ensure pair contains two connections

      const [firstConnection, secondConnection] = pair;
      const [top1, bottom1] = firstConnection.nodes;
      const [top2, bottom2] = secondConnection.nodes;

      // Get the combination of top and bottom nodes (order-independent) as keys
      const topCombination = [top1, top2].sort().join(",");
      const bottomCombination = [bottom1, bottom2].sort().join(",");

      let targetGroup = null;

      // Check if there is already a group containing this combination
      if (groupMap.has(topCombination)) {
        targetGroup = groupMap.get(topCombination);
      } else if (groupMap.has(bottomCombination)) {
        targetGroup = groupMap.get(bottomCombination);
      }

      if (targetGroup) {
        // If a matching group is found, use the same color and add new connection pairs
        const groupColor = targetGroup.color;
        pair.forEach((connection) => {
          // Merge only if connection colors differ
          if (connection.color !== groupColor) {
            connection.color = groupColor;
            colorMerged = true; // Mark color merge occurred
          }
          if (!targetGroup.pairs.includes(connection)) {
            targetGroup.pairs.push(connection);
          }
        });

        // Update targetGroup's nodes to include all relevant nodes
        targetGroup.nodes = Array.from(
          new Set([
            ...targetGroup.nodes,
            top1,
            top2,
            bottom1,
            bottom2,
          ])
        );

      } else {
        // If no matching combination exists, create a new group using the color of the first connection in the pair
        const groupColor = firstConnection.color;
        pair.forEach((connection) => (connection.color = groupColor));
        const newGroup = {
          nodes: [top1, top2, bottom1, bottom2],
          pairs: [...pair],
          color: groupColor,
        };

        // Store the new group in groupMap and newGroups
        groupMap.set(topCombination, newGroup);
        groupMap.set(bottomCombination, newGroup);
        newGroups.push(newGroup);
      }
    });

    // Merge new groups to ensure color consistency
    const mergeGroups = () => {
      let merged = false;
      const groupsToProcess = [...newGroups]; // Copy of new groups to process
      groupsToProcess.forEach((newGroup) => {
        connectionGroups.forEach((existingGroup) => {
          // Check if there are shared top or bottom nodes
          const hasSharedNodes = newGroup.nodes.some((node) =>
            existingGroup.nodes.includes(node)
          );

          if (hasSharedNodes) {
            // Merge colors, using existingGroup's color as the base
            const baseColor = existingGroup.color;
            newGroup.pairs.forEach((connection) => {
              if (connection.color !== baseColor) {
                connection.color = baseColor;
                colorMerged = true;
              }
            });

            // Merge all nodes and connection pairs
            existingGroup.nodes = Array.from(
              new Set([...existingGroup.nodes, ...newGroup.nodes])
            );
            existingGroup.pairs = Array.from(
              new Set([...existingGroup.pairs, ...newGroup.pairs])
            );

            merged = true;

            // Remove processed group from newGroups
            newGroups.splice(newGroups.indexOf(newGroup), 1);
          }
        });
      });
      
      return merged;
    };

    // Recursively call until no more merging occurs
    while (mergeGroups());

    // Update connectionGroups only if color merging happened
    if (colorMerged) {
      setConnectionGroups((prevGroups) => {
        const uniqueGroups = [...prevGroups];
        newGroups.forEach((group) => {
          const existingGroup = uniqueGroups.find(
            (g) => g.nodes.sort().join(",") === group.nodes.sort().join(",")
          );
          if (!existingGroup) uniqueGroups.push(group);
        });
        return uniqueGroups;
      });
    }

    console.log("Finished checkAndGroupConnections");
};

  useEffect(() => {
    if (connectionPairs.length > 0) {
      checkAndGroupConnections();
    }
  }, [connectionPairs]);
  
  
  useEffect(() => {
    checkAndGroupConnections();
  }, [connectionPairs]);

  return (
    
    <div
      style={{
        textAlign: "center",
        position: "relative",
        fontFamily: "Arial, sans-serif",
      }}
      className="AppContainer"
    >
    <h1 className="title">
      <a href="https://mineyev.web.illinois.edu/ColorTaiko!/" target="_blank" style={{ textDecoration: "none" }}>
        <span style={{ color: '#e6194b', backgroundColor: '#000000', fontSize: 'inherit', display: 'inline-block' }}>C</span>
        <span style={{ color: '#3cb44b', backgroundColor: '#000000', fontSize: 'inherit', display: 'inline-block' }}>o</span>
        <span style={{ color: '#ffe119', backgroundColor: '#000000', fontSize: 'inherit', display: 'inline-block' }}>l</span>
        <span style={{ color: '#f58231', backgroundColor: '#000000', fontSize: 'inherit', display: 'inline-block' }}>o</span>
        <span style={{ color: '#dcbeff', backgroundColor: '#000000', fontSize: 'inherit', display: 'inline-block' }}>r</span>
        <span style={{ color: '#9a6324', backgroundColor: '#000000', fontSize: 'inherit', display: 'inline-block' }}>T</span>
        <span style={{ color: '#fabebe', backgroundColor: '#000000', fontSize: 'inherit', display: 'inline-block' }}>a</span>
        <span style={{ color: '#7f00ff', backgroundColor: '#000000', fontSize: 'inherit', display: 'inline-block' }}>i</span>
        <span style={{ color: '#f032e6', backgroundColor: '#000000', fontSize: 'inherit', display: 'inline-block' }}>k</span>
        <span style={{ color: '#42d4f4', backgroundColor: '#000000', fontSize: 'inherit', display: 'inline-block' }}>o</span>
        <span style={{ color: '#bfef45', backgroundColor: '#000000', fontSize: 'inherit', display: 'inline-block' }}>!</span>
      </a>
    </h1>

      <div
        className="progress-bar-container"
        onMouseEnter={showTooltip}
        onMouseMove={showTooltip}
        onMouseLeave={hideTooltip}
      >
        <div className="progress-bar-fill" style={{ width: `${progress}%` }}>
          <span className="progress-bar-text">{Math.round(progress)}%</span>
        </div>
      </div>

      {tooltipVisible && (
        <div
          className="tooltip"
          style={{ top: tooltipPosition.y + 10, left: tooltipPosition.x + 10 }}
        >
          <p>Vertical Edges: {connections.length}</p>
          <p>Top Nodes: {topRowCount - 1}</p>
          <p>Bottom Nodes: {bottomRowCount - 1}</p>
        </div>
      )}

      <button
        onClick={handleClear}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#f44336",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontFamily: "inherit", // This will use the font from the parent element
        }}
      >
  return (
    <div className="app-container">
      <Title />
  
      <ProgressBar
        progress={progress}
        connections={connections}
        topRowCount={topRowCount}
        bottomRowCount={bottomRowCount}
      />
  
      {welcomeMessage && (
        <div className="welcome-message fade-message">Connect the nodes!</div>
      )}
  
      <img
        src={SettingIconImage}
        alt="Settings Icon"
        className="icon"
        onClick={handleToolMenuClick}
      />
  
      {showSettings && (
        <SettingsMenu
          offset={offset}
          onOffsetChange={handleOffsetChange}
          soundbool={soundBool}
          onSoundControl={handleSoundClick}
          blackDotEffect={blackDotEffect}
          onToggleBlackDotEffect={toggleBlackDotEffect}
        />
      )}
  
      <button onClick={handleClear} className="clear-button">
        Clear
      </button>
  
      <ErrorModal
        className="error-container"
        message={errorMessage}
        onClose={() => setErrorMessage("")}
      />
  
      {showNodes && (
        <div className="game-box">
          <div className="game-row">{createTopRow(topRowCount)}</div>
          <svg ref={svgRef} className="svg-overlay" />
          <div className="game-row bottom-row">{createBottomRow(bottomRowCount)}</div>
        </div>
      )}
    </div>
  );
}

export default App;