// import PropTypes from "prop-types";
// import "./settingMenu.css";

// const SettingsMenu = ({
//   offset,
//   onOffsetChange,
//   soundbool,
//   onSoundControl,
//   blackDotEffect,
//   onToggleBlackDotEffect,
//   lightMode,
//   onToggleLightMode,
// }) => {
//   const handleOffsetInput = (e) => {
//     const newOffset = parseInt(e.target.value, 10);
//     onOffsetChange(newOffset);
//   };

//   return (
//     <div className="settings-menu">
//       <h3>Settings</h3>
//       <label>
//         Edge Offset:
//         <input
//           type="range"
//           value={offset}
//           onChange={handleOffsetInput}
//           min="0"
//           max="50"
//           step="1"
//           style={{ width: "100%" }}
//         />
//         <input
//           type="number"
//           value={offset}
//           onChange={handleOffsetInput}
//           min="0"
//           max="50"
//           style={{ marginLeft: "10px", width: "50px" }}
//         />
//       </label>
//       <div style={{ marginTop: "10px" }}>
//         <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//           Sound Control:
//           <span>{soundbool ? "ON" : "OFF"}</span>
//           <input
//             type="checkbox"
//             checked={soundbool}
//             onChange={onSoundControl}
//             style={{ transform: "scale(1.5)" }}
//           />
//         </label>
//       </div>
//       <div style={{ marginTop: "10px" }}>
//         <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//           Black Dot Effect:
//           <span>{blackDotEffect ? "ON" : "OFF"}</span>
//           <input
//             type="checkbox"
//             checked={blackDotEffect}
//             onChange={onToggleBlackDotEffect}
//             style={{ transform: "scale(1.5)" }}
//           />
//         </label>
//         </div>
//         <div style={{ marginTop: "10px" }}>
//         <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//           Light Mode:
//           <span>{lightMode ? "ON" : "OFF"}</span>
//           <input
//             type="checkbox"
//             checked={lightMode}
//             onChange={onToggleLightMode}
//             style={{ transform: "scale(1.5)" }}
//           />
//         </label>
//       </div>
//     </div>
//   );
// };
// SettingsMenu.propTypes = {
//   offset: PropTypes.number.isRequired,
//   onOffsetChange: PropTypes.func.isRequired,
//   soundbool: PropTypes.bool.isRequired,
//   onSoundControl: PropTypes.func.isRequired,
//   blackDotEffect: PropTypes.bool.isRequired,
//   onToggleBlackDotEffect: PropTypes.func.isRequired,
//   lightMode: PropTypes.bool.isRequired,
//   onToggleLightMode: PropTypes.func.isRequired,
// };
// export default SettingsMenu;

import PropTypes from "prop-types";
import "./settingMenu.css";

const SettingsMenu = ({
  offset,
  onOffsetChange,
  soundbool,
  onSoundControl,
  blackDotEffect,
  onToggleBlackDotEffect,
  lightMode,
  onToggleLightMode,
  onClear,
}) => {
  const handleOffsetInput = (e) => {
    const newOffset = parseInt(e.target.value, 10);
    onOffsetChange(newOffset);
  };

  return (
    <div className="settings-menu">
      <h3 className="settings-title">Settings</h3>

      <div className="setting-item">
        <label>Edge Offset</label>
        <div className="offset-input-group">
          <input
            type="range"
            value={offset}
            onChange={handleOffsetInput}
            min="0"
            max="50"
            step="1"
          />
          <input
            type="number"
            value={offset}
            onChange={handleOffsetInput}
            min="0"
            max="50"
          />
        </div>
      </div>

      <div className="setting-item">
        <label>Sound Control</label>
        <div className="toggle-group">
          <span className={`status ${soundbool ? "on" : "off"}`}>
            {soundbool ? "ON" : "OFF"}
          </span>
          <input
            type="checkbox"
            checked={soundbool}
            onChange={onSoundControl}
          />
        </div>
      </div>

      <div className="setting-item">
        <label>Black Dot Effect</label>
        <div className="toggle-group">
          <span className={`status ${blackDotEffect ? "on" : "off"}`}>
            {blackDotEffect ? "ON" : "OFF"}
          </span>
          <input
            type="checkbox"
            checked={blackDotEffect}
            onChange={onToggleBlackDotEffect}
          />
        </div>
      </div>

      <div className="setting-item">
        <label>Light Mode</label>
        <div className="toggle-group">
          <span className={`status ${lightMode ? "on" : "off"}`}>
            {lightMode ? "ON" : "OFF"}
          </span>
          <input
            type="checkbox"
            checked={lightMode}
            onChange={onToggleLightMode}
          />
        </div>
      </div>

      <button className="clear-button" onClick={onClear}>
        Clear
      </button>
    </div>
  );
};

SettingsMenu.propTypes = {
  offset: PropTypes.number.isRequired,
  onOffsetChange: PropTypes.func.isRequired,
  soundbool: PropTypes.bool.isRequired,
  onSoundControl: PropTypes.func.isRequired,
  blackDotEffect: PropTypes.bool.isRequired,
  onToggleBlackDotEffect: PropTypes.func.isRequired,
  lightMode: PropTypes.bool.isRequired,
  onToggleLightMode: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};

export default SettingsMenu;
