import React, { useEffect, useState } from 'react';


import DebugDashboard from './components/Debug/DebugDashboard';
import IntroPage from './components/IntroPage/IntroPage';
import MapComponent from './components/Map/MapComponent';
import { useLogger } from './hooks/useLogger';
import { withErrorLogging } from './utils/logger';

import './App.css';

const App = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [showDebug, setShowDebug] = useState(false);

  // Initialize app-level logging
  const { info, debug } = useLogger('App');

  const handleIntroComplete = () => {
    info('User completed intro');
    setShowIntro(false);
  };

  const handleShowIntro = () => {
    info('User requested to show intro');
    setShowIntro(true);
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
          <header className="app-header bg-obsidian text-white"></header>
          <main>
            <MapComponent onShowIntro={handleShowIntro} />
          </main>
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
