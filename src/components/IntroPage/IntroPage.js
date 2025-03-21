import React from 'react';
import './IntroPage.css';

const IntroPage = ({ onComplete }) => {
  return (
    <div className="intro-page">
      <div className="intro-content">
        <h1>Welcome to Wildfire Map Tool</h1>
        
        <div className="intro-section">
          <h2>About This Tool</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. 
            Mauris euismod, nisi vel consectetur interdum, nisl nisi aliquam nisi, 
            eget tincidunt nisl nisi vel nisl.
          </p>
        </div>
        
        <div className="intro-section">
          <h2>How to Use</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. 
            Mauris euismod, nisi vel consectetur interdum, nisl nisi aliquam nisi, 
            eget tincidunt nisl nisi vel nisl.
          </p>
        </div>
        
        <div className="intro-section">
          <h2>Features</h2>
          <ul>
            <li>Feature 1: Lorem ipsum dolor sit amet</li>
            <li>Feature 2: Consectetur adipiscing elit</li>
            <li>Feature 3: Nulla facilisi mauris euismod</li>
          </ul>
        </div>
        
        <button className="enter-button" onClick={onComplete}>
          Enter Map
        </button>
      </div>
    </div>
  );
};

export default IntroPage;
