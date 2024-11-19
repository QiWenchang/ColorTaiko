import React, { useState } from "react";
import "./style.css";

const StageIndicator = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(null);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleOptionSelect = (number) => {
    setSelectedNumber(number);
    setIsExpanded(false);
  };

  return (
    <div className="horizontal-circle-container">
      {!isExpanded && (
        <div className="main-circle" onClick={toggleExpand}>
          {selectedNumber !== null ? selectedNumber : '?'}
        </div>
      )}

      <div className={`options-background ${isExpanded ? 'expanded' : ''}`}>
        <div className={`options-wrapper ${isExpanded ? 'expanded' : 'collapsed'}`}>
          {[1, 2, 3, 4].map((number, index) => (
            <div
              key={number}
              className={`option-circle ${
                number === selectedNumber ? 'selected' : ''
              }`}
              style={{ transitionDelay: `${index * 0.05}s` }}
              onClick={() => handleOptionSelect(number)}
            >
              {number}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


export default StageIndicator;