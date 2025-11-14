import PropTypes from "prop-types";
import { useState } from 'react';
import './progressBar.css';


const ProgressBar = ({ progress, connections, connectionGroups = [], topRowCount, bottomRowCount, lightMode}) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const [hoverTopAll, setHoverTopAll] = useState(false);
  const [hoverBottomAll, setHoverBottomAll] = useState(false);

  const togglePanel = () => setPanelOpen((v) => !v);

  const onKeyToggle = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePanel();
    }
  };

  const topCount = Math.max(topRowCount - 1, 0);
  const bottomCount = Math.max(bottomRowCount - 1, 0);
  const denom = topCount * bottomCount || 1; // avoid divide by zero
  const edgeCount = connections.length;
  const successPct = Number((edgeCount / denom) * 100).toPrecision(4);

  return (
    <div style={{ marginTop: '-55px' }}>
      <p className="text" style={{ color: lightMode ? 'black' : '#837b7b', fontSize: '14px', textAlign: 'left', marginBottom: '0px' }}>
        Can you get to 100%?
      </p>

      <div className="progress-bar-wrapper">
        <div
          className={`progress-bar-container ${panelOpen ? 'is-open' : ''}`}
          role="button"
          tabIndex={0}
          onClick={togglePanel}
          onKeyDown={onKeyToggle}
          aria-expanded={panelOpen}
          aria-controls="progress-info-panel"
          title={panelOpen ? 'Hide progress details' : 'Show progress details'}
        >
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}>
            <span className="progress-bar-text">{Math.round(progress)}%</span>
          </div>
        </div>

        {panelOpen && (() => {
          const topLabels = Array.from({ length: topRowCount - 1 }, (_, i) => `a${i + 1}`);
          const bottomLabels = Array.from({ length: bottomRowCount - 1 }, (_, i) => `b${i + 1}`);

          // Summarization threshold: if label count exceeds this, show first ... last
          const SUMMARY_THRESHOLD = 4; // summarize earlier to keep line compact and avoid pushing final result

          const summarize = (labels, forceFull) => {
            if (forceFull || labels.length <= SUMMARY_THRESHOLD) return labels.map(l => ({ type: 'label', value: l }));
            if (labels.length === 0) return [];
            if (labels.length === 1) return [{ type: 'label', value: labels[0] }];
            return [
              { type: 'label', value: labels[0] },
              { type: 'ellipsis', value: '…' },
              { type: 'label', value: labels[labels.length - 1] }
            ];
          };
          // Build dynamic color mapping from connectionGroups; fallback to base palette
          const getVertexColor = (vertexId) => {
            // Priority 1: group color
            const group = connectionGroups.find(g => Array.isArray(g.nodes) && g.nodes.includes(vertexId));
            if (group?.color) return group.color;
            // Priority 2: most recent connection involving this vertex
            for (let i = connections.length - 1; i >= 0; i--) {
              const conn = connections[i];
              if (Array.isArray(conn.nodes) && conn.nodes.includes(vertexId) && conn.color) {
                return conn.color;
              }
            }
            // Priority 3: unconnected – return null (no color override)
            return null;
          };
          const topColors = topLabels.map((_, i) => getVertexColor(`top-${i}`));
          const bottomColors = bottomLabels.map((_, i) => getVertexColor(`bottom-${i}`));
          const summarizedTop = summarize(topLabels, false);
          const summarizedBottom = summarize(bottomLabels, false);
          return (
            <div id="progress-info-panel" className="progress-info-panel" role="region" aria-label="Progress details">
              <div className="progress-info-header">
                <div className="metric-block">
                  <div className="metric-label metric-label--split">
                    <span>vertical edges</span>
                    <span className="metric-var">(E)</span>
                  </div>
                  <span className="metric-value var-e">{edgeCount}</span>
                </div>
                <div className="metric-block metric-block--split">
                  <div className="metric-label metric-label--split">
                    <span>TOP VERTICES</span>
                    <span className="metric-var">(m)</span>
                  </div>
                  <span className="metric-value var-m">{topCount}</span>
                </div>
                <div className="metric-block">
                  <div className="metric-label metric-label--split">
                    <span>bottom vertices</span>
                    <span className="metric-var">(n)</span>
                  </div>
                  <span className="metric-value var-n">{bottomCount}</span>
                </div>
              </div>
              <div className="progress-math">
                <div className="equation-area" aria-label="success formula">
                  <div className="primary-row">
                    <div className="success-title" aria-hidden="true">success rate =</div>
                    <div className="equation-line primary-symbolic symbolic-box">
                      <span className="sym sym-e">E</span>
                      <span className="sym sym-div">/</span>
                      <span className="sym sym-m">m</span>
                      <span className="sym sym-dot">·</span>
                      <span className="sym sym-n">n</span>
                    </div>
                  </div>
                  <div className="equation-line fraction-display">
                    <div className="diag-frac">
                      <span className="frac-left var-e">{edgeCount}</span>
                      <span className="big-slash">/</span>
                      <div className="frac-right">
                        <div className="frac-top vertex-group top-group" onMouseLeave={() => setHoverTopAll(false)}>
                          {summarizedTop.map((item, idx) => {
                            if (item.type === 'ellipsis') {
                              return (
                                <span
                                  key={`top-ellipsis`}
                                  className="vertex-label vertex-ellipsis"
                                  title="Show all top labels"
                                  onMouseEnter={() => setHoverTopAll(true)}
                                >{item.value}</span>
                              );
                            }
                            const originalIndex = item.value === topLabels[0] ? 0 : (item.value === topLabels[topLabels.length - 1] ? topLabels.length - 1 : idx);
                            const color = topColors[originalIndex];
                            return (
                              <span
                                key={item.value}
                                className={`vertex-label top-label ${color ? 'is-connected' : 'is-unconnected'}`}
                                style={color ? { color } : undefined}
                              >
                                {item.value}
                              </span>
                            );
                          })}
                          {hoverTopAll && summarizedTop.some(i => i.type === 'ellipsis') && (
                            <div className="labels-popover top-popover above" role="dialog" aria-label="All top labels" onMouseLeave={() => setHoverTopAll(false)}>
                              {topLabels.map((l, i) => (
                                <span key={`full-top-${l}`} className="popover-label" style={topColors[i] ? { color: topColors[i] } : undefined}>{l}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="frac-bottom vertex-group bottom-group" onMouseLeave={() => setHoverBottomAll(false)}>
                          {summarizedBottom.map((item, idx) => {
                            if (item.type === 'ellipsis') {
                              return (
                                <span
                                  key={`bottom-ellipsis`}
                                  className="vertex-label vertex-ellipsis"
                                  title="Show all bottom labels"
                                  onMouseEnter={() => setHoverBottomAll(true)}
                                >{item.value}</span>
                              );
                            }
                            const originalIndex = item.value === bottomLabels[0] ? 0 : (item.value === bottomLabels[bottomLabels.length - 1] ? bottomLabels.length - 1 : idx);
                            const color = bottomColors[originalIndex];
                            return (
                              <span
                                key={item.value}
                                className={`vertex-label bottom-label ${color ? 'is-connected' : 'is-unconnected'}`}
                                style={color ? { color } : undefined}
                              >
                                {item.value}
                              </span>
                            );
                          })}
                          {hoverBottomAll && summarizedBottom.some(i => i.type === 'ellipsis') && (
                            <div className="labels-popover bottom-popover above" role="dialog" aria-label="All bottom labels" onMouseLeave={() => setHoverBottomAll(false)}>
                              {bottomLabels.map((l, i) => (
                                <span key={`full-bottom-${l}`} className="popover-label" style={bottomColors[i] ? { color: bottomColors[i] } : undefined}>{l}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="sym sym-eq mid">=</span>
                    <span className="result-value final-result">{successPct}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
ProgressBar.propTypes = {
  progress: PropTypes.number.isRequired,
  connections: PropTypes.array.isRequired,
  connectionGroups: PropTypes.array, // array of {nodes:[], color:string}
  topRowCount: PropTypes.number.isRequired,
  bottomRowCount: PropTypes.number.isRequired,
  lightMode: PropTypes.bool.isRequired
};

export default ProgressBar;
