import React from 'react';
import Map from './Map';

const App = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Wildfire Webapp</h1>
      </header>
      <main>
        <Map />
      </main>
      <footer>
        <p>© 2024 Wildfire Webapp</p>
      </footer>
    </div>
  );
};

export default App;