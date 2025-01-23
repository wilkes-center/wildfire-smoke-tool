import React, { useEffect, useState } from 'react';
import { CornerUpLeft } from 'lucide-react';

const DrawingTooltip = ({ drawingMode, tempPolygon }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!drawingMode) {
      setIsVisible(false);
      return;
    }

    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [drawingMode]);

  if (!isVisible || !drawingMode) return null;

  const getMessage = () => {
    if (tempPolygon.length === 0) {
      return 'Click to start drawing';
    }
    if (tempPolygon.length === 1) {
      return 'Click to add points';
    }
    return 'Double-click to finish';
  };

  return (
    <div 
      className="fixed pointer-events-none z-50 flex items-center bg-white/90 backdrop-blur-sm shadow-lg rounded-lg px-3 py-2 text-sm text-gray-700 font-medium"
      style={{
        left: position.x + 16,
        top: position.y + 16,
        transform: 'translate(0, -50%)'
      }}
    >
      {tempPolygon.length >= 2 && (
        <CornerUpLeft className="w-4 h-4 mr-2 text-gray-500" />
      )}
      {getMessage()}
    </div>
  );
};

export default DrawingTooltip;