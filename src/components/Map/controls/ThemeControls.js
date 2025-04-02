import React, { useState } from 'react';
import { Sun, Moon, Layers, Map as MapIcon } from 'lucide-react';

export const ThemeControls = ({
  isDarkMode,
  setIsDarkMode,
  currentBasemap,
  setCurrentBasemap,
  basemapOptions
}) => {
  const [showBasemaps, setShowBasemaps] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Dark Mode Toggle */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 text-white hover:bg-gray-700' 
            : 'bg-gray-50 text-forest hover:bg-gray-100'
        }`}
        title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      {/* Basemap Selector */}
      <div className="relative">
        <button
          onClick={() => setShowBasemaps(!showBasemaps)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 text-white hover:bg-gray-700' 
              : 'bg-gray-50 text-forest hover:bg-gray-100'
          }`}
          title="Change map style"
        >
          <Layers className="w-5 h-5" />
        </button>

        {showBasemaps && (
          <div className={`absolute top-full right-0 mt-2 rounded-lg shadow-lg border min-w-[140px] ${
            isDarkMode ? 'bg-gray-800 border-white' : 'bg-white border-mahogany'
          }`}>
            {Object.values(basemapOptions).map((basemap) => (
              <button
                key={basemap.url}
                onClick={() => {
                  setCurrentBasemap(basemap.url);
                  setShowBasemaps(false);
                }}
                className={`w-full px-4 py-2 flex items-center gap-2 transition-colors ${
                  currentBasemap === basemap.url
                    ? isDarkMode 
                      ? 'bg-forest-dark text-white' 
                      : 'bg-sage-light text-forest'
                    : isDarkMode
                      ? 'text-white/80 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <MapIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{basemap.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};