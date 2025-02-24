import React from 'react';
import { HelpCircle } from 'lucide-react';

const TourButton = ({ onClick, isDarkMode }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed z-50 right-4 bottom-24 w-12 h-12 rounded-full shadow-lg backdrop-blur-sm flex items-center justify-center transition-all ${
        isDarkMode 
          ? 'bg-gray-800/90 hover:bg-gray-700/90 text-purple-400 border-2 border-purple-500/50' 
          : 'bg-white/90 hover:bg-gray-50/90 text-purple-600 border-2 border-purple-500/50'
      } hover:scale-110`}
      title="Show map tour"
    >
      <HelpCircle className="w-6 h-6" />
    </button>
  );
};

export default TourButton;