import React from 'react';
import { PlayCircle } from 'lucide-react';

const TourButton = ({ onClick, isDarkMode }) => {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 rounded-full shadow-lg backdrop-blur-sm flex items-center justify-center transition-all ${
        isDarkMode 
          ? 'bg-green/90 hover:bg-green/80 text-white border-2 border-white/50' 
          : 'bg-white/90 hover:bg-gray-50/90 text-green border-2 border-green/50'
      } hover:scale-110 font-sora`}
      title="Start interactive tour"
    >
      <PlayCircle className="w-6 h-6" />
    </button>
  );
};

export default TourButton;