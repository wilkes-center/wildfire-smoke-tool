import React from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeControls = ({
  isDarkMode,
  setIsDarkMode
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Dark Mode Toggle */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors backdrop-blur-sm shadow-lg ${
          isDarkMode 
            ? 'bg-white/90 text-gray-800 hover:bg-white/80' 
            : 'bg-white/90 text-forest hover:bg-white/80'
        }`}
        title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>
    </div>
  );
};