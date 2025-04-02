import React, { useEffect } from 'react';
import './IntroPage.css';
import { Wind, Clock, PenLine, Sun, Moon, MapPin, Github, MessageSquare } from 'lucide-react';

const IntroPage = ({ onComplete }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "//gc.zgo.at/count.js";
    script.async = true;
    script.dataset.goatcounter = "https://wilkes-wildfire-smoke.goatcounter.com/count";
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="intro-page">
      <div className="intro-content">
        <div className="header-section">
          <div className="title-wrapper">
            <h1 className="font-sora font-semibold text-section-header text-obsidian">
              <span className="text-mahogany">Wildfire</span> Smoke Map Tool
            </h1>
            <div className="title-underline"></div>
          </div>
        </div>
        
        <button 
          className="enter-button bg-green text-white hover:bg-sage font-sora flex items-center justify-center mx-auto mt-6 mb-16"
          onClick={onComplete}
        >
          <MapPin className="mr-2" size={18} />
          Enter Map
        </button>
        
        <div className="intro-section bg-gradient-to-r from-white to-blue/10 p-6 rounded-xl border-l-4 border-green shadow-md">
          <h2 className="font-sora font-semibold text-sub-header text-obsidian flex items-center">
            <MapPin className="mr-2 text-mahogany" size={24} />
            About This Tool
          </h2>
          <p className="font-redhat text-body text-obsidian">
            This interactive visualization tool displays wildfire smoke PM2.5 concentrations across the United States.
            The map shows a 4-day window of data: 2 days of historical (archival) data and 2 days of forecast data,
            allowing you to track air quality patterns and anticipate changes in smoke conditions.

            <p>For more information, refer to the research paper/ Methodology: <a href="xyz.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">xyz.com</a></p>
          </p>
        </div>
        
        <div className="intro-section bg-gradient-to-r from-white to-sage/10 p-6 rounded-xl border-l-4 border-sage shadow-md">
          <h2 className="font-sora font-semibold text-sub-header text-obsidian flex items-center">
            <Clock className="mr-2 text-green" size={24} />
            How to Use
          </h2>
          <ul className="font-redhat text-body text-obsidian mb-4 list-disc pl-5">
            <li className="text-left">Navigate the map using standard zoom and pan controls.</li>
            <li className="text-left">Use the time controls at the bottom to play through the 4-day timeline or jump to a specific date and time.</li>
            <li className="text-left">Adjust the PM2.5 threshold slider to filter the visible smoke concentrations.</li>
            <li className="text-left">Toggle between light and dark mode for your preferred viewing experience.</li>
          </ul>
          <div className="video-container">
            <iframe
              width="100%"
              height="315"
              src="https://www.youtube.com/embed/dummyVideoLink"
              title="How to Use the Wildfire Smoke Map Tool"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
        
        <div className="feedback-section bg-gradient-to-r from-white to-blue/10 p-5 rounded-xl border-l-4 border-blue shadow-md mt-4">
          <h3 className="font-sora font-medium text-blue flex items-center">
            <MessageSquare className="mr-2" size={20} />
            Feedback & Support
          </h3>
          <p className="font-redhat text-xs text-obsidian mt-2">
            We value your feedback and suggestions for improving this tool. If you encounter any issues or have ideas for new features,
            please submit a GitHub issue on our repository. This helps us track and address your concerns effectively.
          </p>
          <div className="mt-3 flex items-center">
            <Github size={16} className="mr-2 text-obsidian" />
            <a href="https://github.com/wilkes-center/wildfire-smoke-tool/issues" className="font-redhat text-xs font-medium text-obsidian">Submit issues at: https://github.com/wilkes-center/wildfire-smoke-tool/issues</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroPage;
