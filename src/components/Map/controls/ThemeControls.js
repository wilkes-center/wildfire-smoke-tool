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
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2 flex gap-2">
      {/* Dark Mode Toggle */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
        }`}
        title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      <div className={`w-px h-10 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
{/* Modify the placement of the icons on the top-left to place all the icons on the top layer as a title layer*/}
{/* */}
      {/* Basemap Selector */}
      <div className="relative">
        <button
          onClick={() => setShowBasemaps(!showBasemaps)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
          title="Change map style"
        >
          <Layers className="w-5 h-5" />
        </button>

        {showBasemaps && (
          <div className={`absolute top-full left-14 -mt-5 rounded-lg shadow-lg border min-w-[140px] ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
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
                      ? 'bg-gray-700 text-blue-400' 
                      : 'bg-blue-50 text-blue-600'
                    : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-700'
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