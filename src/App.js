import React, { useEffect, useState } from 'react';

import DebugDashboard from './components/Debug/DebugDashboard';
import IntroPage from './components/IntroPage/IntroPage';
import LoadingAnimation from './components/LoadingAnimation/LoadingAnimation';
import MapComponent from './components/Map/MapComponent';
import { useLogger } from './hooks/useLogger';
import { withErrorLogging } from './utils/logger';

import './App.css';

const App = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Initialize app-level logging
  const { info, debug } = useLogger('App');

  const handleIntroComplete = () => {
    info('User completed intro');
    setShowIntro(false);
    setShowLoading(true);
    setShowMap(true); // Start map initialization immediately

    // Hide loading animation after 2 seconds
    setTimeout(() => {
      setShowLoading(false);
    }, 2000);
  };

  const handleShowIntro = () => {
    info('User requested to show intro');
    setShowIntro(true);
    setShowLoading(false);
    setShowMap(false);
  };

  // Debug dashboard keyboard shortcut
  useEffect(() => {
    const handleKeyPress = e => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        debug('Debug dashboard toggled via keyboard shortcut');
        setShowDebug(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [debug]);

  return (
    <div className="app font-sora">
      {showIntro ? (
        <IntroPage onComplete={handleIntroComplete} />
      ) : (
        <>
          {/* Loading animation overlay */}
          {showLoading && (
            <div className="fixed inset-0 z-50">
              <LoadingAnimation />
            </div>
          )}

          {/* Map component - starts loading immediately but hidden behind animation */}
          {showMap && (
            <>
              <header className="app-header bg-obsidian text-white"></header>
              <main>
                <MapComponent onShowIntro={handleShowIntro} />
              </main>
            </>
          )}
        </>
      )}

      {/* Debug Dashboard - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <DebugDashboard isOpen={showDebug} onClose={() => setShowDebug(false)} />
      )}
    </div>
  );
};

export default withErrorLogging(App, 'App');
