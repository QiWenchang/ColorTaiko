import PropTypes from "prop-types";

const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1200,
    color: "black",
    padding: "20px",
    boxSizing: "border-box",
  },
  dialog: {
    backgroundColor: "white",
    padding: "32px",
    borderRadius: "12px",
    boxShadow: "0 6px 24px rgba(0, 0, 0, 0.25)",
    maxWidth: "520px",
    width: "100%",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    marginTop: 0,
    marginBottom: "16px",
    color: "#d4380d",
    fontSize: "24px",
  },
  list: {
    listStyleType: "none",
    padding: 0,
    margin: "16px 0 24px",
  },
  listItem: {
    marginBottom: "12px",
    lineHeight: 1.4,
    color: "#333333",
  },
  badge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "10px",
    backgroundColor: "#f0f0f0",
    fontSize: "12px",
    marginRight: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#555555",
  },
  colorSwatch: {
    display: "inline-block",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    marginRight: "6px",
    border: "1px solid rgba(0,0,0,0.1)",
    verticalAlign: "middle",
  },
  closeButton: {
    border: "none",
    backgroundColor: "#1677ff",
    color: "white",
    padding: "10px 18px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "16px",
  },
  secondaryText: {
    marginTop: "4px",
    fontSize: "13px",
    color: "#666666",
  },
};

const NoFoldViolationModal = ({ data, onClose }) => {
  if (!data) return null;

  const { message, violations } = data;
  const edgeMap = new Map();

  if (Array.isArray(violations)) {
    violations.forEach((violation) => {
      const sequence = violation?.sequence || "top";
      violation?.edges?.forEach((edge) => {
        if (!edge?.id) return;
        const key = `${sequence}:${edge.id}`;
        if (!edgeMap.has(key)) {
          edgeMap.set(key, {
            key,
            id: edge.id,
            sequence,
            nodes: Array.isArray(edge.nodes) ? edge.nodes : [],
            color: edge.color || "#ff4d4f",
            orientation: edge.orientation || "right",
            pairId: edge.pairId || null,
          });
        }
      });
    });
  }

  const uniqueEdges = Array.from(edgeMap.values());

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.dialog} role="alertdialog" aria-modal="true">
        <h2 style={modalStyles.header}>No-Fold Warning</h2>
        <p>{message || "No-Fold condition failed."}</p>
        {uniqueEdges.length > 0 && (
          <ul style={modalStyles.list}>
            {uniqueEdges.map((edge) => {
              const sequenceLabel = edge.sequence === "bottom" ? "Bottom" : "Top";
              const nodesLabel = edge.nodes.join(" <-> ") || edge.id;
              return (
                <li key={edge.key} style={modalStyles.listItem}>
                  <span style={modalStyles.badge}>{sequenceLabel}</span>
                  <span style={{ ...modalStyles.colorSwatch, backgroundColor: edge.color }} />
                  <strong>{nodesLabel}</strong>
                  <div style={modalStyles.secondaryText}>
                    Orientation: {edge.orientation || "right"}
                    {edge.pairId ? ` | Pair: ${edge.pairId}` : ""}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <button type="button" onClick={onClose} style={modalStyles.closeButton}>
          Close
        </button>
      </div>
    </div>
  );
};

NoFoldViolationModal.propTypes = {
  data: PropTypes.shape({
    message: PropTypes.string,
    violations: PropTypes.arrayOf(
      PropTypes.shape({
        sequence: PropTypes.string,
        type: PropTypes.string,
        edges: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.string,
            nodes: PropTypes.arrayOf(PropTypes.string),
            color: PropTypes.string,
            orientation: PropTypes.string,
            pairId: PropTypes.string,
          })
        ),
      })
    ),
  }),
  onClose: PropTypes.func.isRequired,
};

export default NoFoldViolationModal;
