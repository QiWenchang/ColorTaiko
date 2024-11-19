// ButtonGroup.js
import {useState} from "react";
import "./style.css";
import PropTypes from "prop-types";

const ButtonLeft = () => {
  return (
<svg className="button-left" width="98" height="44" viewBox="0 0 98 44" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_d_7_185)">
<mask id="path-1-inside-1_7_185" fill="white">
<path d="M2 9C2 4.58172 5.58172 1 10 1H96V41H10C5.58172 41 2 37.4183 2 33V9Z"/>
</mask>
<path d="M2 9C2 4.58172 5.58172 1 10 1H96V41H10C5.58172 41 2 37.4183 2 33V9Z" fill="#F4F4F5"/>
<path d="M2 9C2 4.02944 6.02944 0 11 0H97L95 2H10C5.58172 2 2 5.13401 2 9ZM97 42H11C6.02944 42 2 37.9706 2 33C2 36.866 5.58172 40 10 40H95L97 42ZM2 41V1V41ZM97 0V42L95 40V2L97 0Z" fill="#E1E1E2" mask="url(#path-1-inside-1_7_185)"/>
</g>
<g filter="url(#filter1_d_7_185)">
<path d="M41 15.8182C41 14.814 41.814 14 42.8182 14H49.1818C50.186 14 51 14.814 51 15.8182V22.1818C51 23.186 50.186 24 49.1818 24H42.8182C41.814 24 41 23.186 41 22.1818V15.8182Z" fill="black" fillOpacity="0.15"/>
<path d="M41 18V24M41 24H47M41 24C43.3274 21.9114 45.4829 19.5468 48.7453 19.0878C50.6777 18.8159 52.6461 19.1794 54.3539 20.1234C56.0617 21.0675 57.4164 22.5409 58.2139 24.3218" stroke="#E84747" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</g>
<defs>
<filter id="filter0_d_7_185" x="0" y="0" width="98" height="44" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
<feFlood floodOpacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.101961 0 0 0 0 0.101961 0 0 0 0 0.101961 0 0 0 0.08 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_7_185"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_7_185" result="shape"/>
</filter>
<filter id="filter1_d_7_185" x="33" y="9" width="32" height="32" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
<feFlood floodOpacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="4"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_7_185"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_7_185" result="shape"/>
</filter>
</defs>
</svg>

  );
};

const ButtonCenter = () => {
  return (
<svg className="button-center" width="56" height="44" viewBox="0 0 56 44" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_d_7_299)">
<mask id="path-1-inside-1_7_299" fill="white">
<path d="M2 1H54V41H2V1Z"/>
</mask>
<path d="M2 1H54V41H2V1Z" fill="#F4F4F5"/>
<path d="M54 1H55V0H54V1ZM54 41V42H55V41H54ZM2 2H54V0H2V2ZM53 1V41H55V1H53ZM54 40H2V42H54V40Z" fill="#E1E1E2" mask="url(#path-1-inside-1_7_299)"/>
</g>
<path d="M36.5 24.3333V28.4074C36.5 28.9477 36.3068 29.4658 35.963 29.8478C35.6192 30.2298 35.1529 30.4444 34.6667 30.4444H21.8333C21.3471 30.4444 20.8808 30.2298 20.537 29.8478C20.1932 29.4658 20 28.9477 20 28.4074V24.3333M32.8333 17.2037L28.25 12.1111M28.25 12.1111L23.6667 17.2037M28.25 12.1111V24.3333" stroke="#1E1E1E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
<defs>
<filter id="filter0_d_7_299" x="0" y="0" width="56" height="44" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
<feFlood floodOpacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.101961 0 0 0 0 0.101961 0 0 0 0 0.101961 0 0 0 0.08 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_7_299"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_7_299" result="shape"/>
</filter>
</defs>
</svg>

  );
};

const ButtonRight = ({handleToolMenuClick}) => {
    const [isArrow, setIsArrow] = useState(false);
  
    const toggleIcon = () => {
      setIsArrow((prev) => !prev);
      handleToolMenuClick();
    };
  
    return (
      <svg
        className={`button-right ${isArrow ? "arrow" : "bars"}`}
        onClick={toggleIcon}
        width="56"
        height="44"
        viewBox="0 0 56 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          {/* bar */}
          <rect x="17" y="14" width="22" height="2" rx="1" className="bar bar1" />
          <rect x="17" y="21" width="22" height="2" rx="1" className="bar bar2"/>
          <rect x="17" y="28" width="22" height="2" rx="1" className="bar bar3"/>
  
          {/* arrow */}
          <path
            d="M17 28L28 17L39 28"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="arrow-head"
          />
        </g>
      </svg>
    );
  };

const ButtonGroup = ({handleToolMenuClick}) => {
  return (
    <div className="component">
      <div className="button-group">
        <ButtonLeft />
        <ButtonCenter />
        <ButtonRight handleToolMenuClick={handleToolMenuClick} />
      </div>
    </div>
  );
};

PropTypes.ButtonGroup = {
    handleToolMenuClick: PropTypes.func,
    };

export default ButtonGroup;
