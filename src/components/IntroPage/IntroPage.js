import React from 'react';
import './IntroPage.css';

const IntroPage = ({ onComplete }) => {
  return (
    <div className="intro-page">
      <div className="intro-content">
        <h1 className="font-sora font-semibold text-section-header text-obsidian">Welcome to Wildfire Map Tool</h1>
        
        <div className="intro-section">
          <h2 className="font-sora font-semibold text-sub-header text-obsidian">About This Tool</h2>
          <p className="font-redhat text-body text-obsidian">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. 
            Mauris euismod, nisi vel consectetur interdum, nisl nisi aliquam nisi, 
            eget tincidunt nisl nisi vel nisl.
          </p>
        </div>
        
        <div className="intro-section">
          <h2 className="font-sora font-semibold text-sub-header text-obsidian">How to Use</h2>
          <p className="font-redhat text-body text-obsidian">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. 
            Mauris euismod, nisi vel consectetur interdum, nisl nisi aliquam nisi, 
            eget tincidunt nisl nisi vel nisl.
          </p>
        </div>
        
        <div className="intro-section">
          <h2 className="font-sora font-semibold text-sub-header text-obsidian">Features</h2>
          <ul>
            <li className="font-redhat text-body text-obsidian">Feature 1: Lorem ipsum dolor sit amet</li>
            <li className="font-redhat text-body text-obsidian">Feature 2: Consectetur adipiscing elit</li>
            <li className="font-redhat text-body text-obsidian">Feature 3: Nulla facilisi mauris euismod</li>
          </ul>
        </div>
        
        <button 
          className="enter-button bg-green text-white hover:bg-sage font-sora" 
          onClick={onComplete}
        >
          Enter Map
        </button>
      </div>
    </div>
  );
};

export default IntroPage;
