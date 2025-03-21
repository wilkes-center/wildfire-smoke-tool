import React, { useState } from 'react';
import MapComponent from './components/Map/MapComponent';
import IntroPage from './components/IntroPage/IntroPage';
import './App.css';

const App = () => {
  const [showIntro, setShowIntro] = useState(true);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  return (
    <div className="App">
      {showIntro ? (
        <IntroPage onComplete={handleIntroComplete} />
      ) : (
        <main>
          <MapComponent />
        </main>
      )}
    </div>
  );
};

export default App;