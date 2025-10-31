import PropTypes from "prop-types";
import "./miniLevelSelector.css";

// Compact preview of the level graph used on the homepage.
// - Click a node to select the level (calls onSelect(name)).
// - Click the magnifier button to open the full modal (onOpenFull).
function MiniLevelSelector({ graph, selectedLevel, onSelect, onOpenFull }) {
  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];

  const viewW = 140;
  const viewH = 88;

  return (
    <div className="mini-level-selector" role="group" aria-label="Level selector">
      <svg
        className="mini-level-selector__svg"
        viewBox={`0 0 ${viewW} ${viewH}`}
        preserveAspectRatio="xMidYMid meet"
        role="button"
        aria-label="Open levels"
        tabIndex={0}
        onClick={onOpenFull}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onOpenFull();
        }}
      >
        {/* edges */}
        {edges.map(([fromId, toId]) => {
          const from = nodes.find((n) => n.id === fromId);
          const to = nodes.find((n) => n.id === toId);
          if (!from || !to) return null;
          const x1 = (from.xPercent / 100) * viewW;
          const y1 = (from.yPercent / 100) * viewH;
          const x2 = (to.xPercent / 100) * viewW;
          const y2 = (to.yPercent / 100) * viewH;
          return (
            <line
              key={`${fromId}-${toId}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity="0.25"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {/* nodes as small circles */}
        {nodes.map((node) => {
          const cx = (node.xPercent / 100) * viewW;
          const cy = (node.yPercent / 100) * viewH;
          const isSelected = selectedLevel === node.name;
          return (
            <g
              key={node.id}
              className={`mini-level-node ${node.unlocked ? "unlocked" : "locked"} ${isSelected ? "selected" : ""}`}
              transform={`translate(${cx}, ${cy})`}
              onClick={(e) => {
                // prevent the svg-level click from firing when user clicks a node
                e.stopPropagation();
                if (node.unlocked) onSelect(node.name);
              }}
              role="button"
              tabIndex={node.unlocked ? 0 : -1}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && node.unlocked) {
                  e.stopPropagation();
                  onSelect(node.name);
                }
              }}
              aria-pressed={isSelected}
              aria-label={node.name}
            >
              {/* halo circle rendered behind to avoid shifting the node when highlighted */}
              {isSelected && (
                <circle className="mini-level-node__halo" r="10" cx={0} cy={0} />
              )}

              <circle className="mini-level-node__circle" r="6" cx={0} cy={0} />
            </g>
          );
        })}
      </svg>

      <button
        type="button"
        className="mini-level-selector__expand"
        title="Open levels"
        aria-label="Open levels"
        onClick={onOpenFull}
      >
        ▣
      </button>
    </div>
  );
}

MiniLevelSelector.propTypes = {
  graph: PropTypes.shape({
    nodes: PropTypes.array,
    edges: PropTypes.array,
  }),
  selectedLevel: PropTypes.string,
  onSelect: PropTypes.func,
  onOpenFull: PropTypes.func,
};

MiniLevelSelector.defaultProps = {
  graph: { nodes: [], edges: [] },
  selectedLevel: null,
  onSelect: () => {},
  onOpenFull: () => {},
};

export default MiniLevelSelector;
