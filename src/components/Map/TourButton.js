import React from 'react';
import { HelpCircle } from 'lucide-react';

const TourButton = ({ onClick, isDarkMode }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed z-50 right-4 bottom-24 w-12 h-12 rounded-full shadow-lg backdrop-blur-sm flex items-center justify-center transition-all ${
        isDarkMode 
          ? 'bg-obsidian/90 hover:bg-obsidian/80 text-white border-2 border-white/50' 
          : 'bg-white/90 hover:bg-gray-50/90 text-green border-2 border-mahogany/50'
      } hover:scale-110 font-sora`}
      title="Show map tour"
    >
      <HelpCircle className="w-6 h-6" />
    </button>
  );
};

export default TourButton;