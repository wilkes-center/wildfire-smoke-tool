import React, { useState } from 'react';
import MapComponent from './components/Map/MapComponent';
import IntroPage from './components/IntroPage/IntroPage';
import './App.css';

const App = () => {
  const [showIntro, setShowIntro] = useState(true);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  const handleShowIntro = () => {
    setShowIntro(true);
  };

  return (
    <div className="App font-sora">
      {showIntro ? (
        <IntroPage onComplete={handleIntroComplete} />
      ) : (
        <>
          <header className="App-header bg-obsidian text-white">
          </header>
          <main>
            <MapComponent onShowIntro={handleShowIntro} />
          </main>
        </>
      )}
    </div>
  );
};

export default App;