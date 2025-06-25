import React from 'react';

import './LoadingAnimation.css';

const LoadingAnimation = () => {
  return (
    <div className="fixed inset-0 font-sora bg-white flex items-center justify-center">
      <div className="loading-container">
        <div className="fixed-circle"></div>

        <svg className="triangles-svg" viewBox="0 0 280 245" xmlns="http://www.w3.org/2000/svg">
          <g>
            <path d="M 28 224 L 140 224 L 28 112 Z" fill="#8FA775"/>
            <path d="M 140 224 L 252 224 L 252 112 Z" fill="#1B5E5F"/>
          </g>
        </svg>

        <div className="loading-text">
          Loading<span className="loading-dots"></span>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
