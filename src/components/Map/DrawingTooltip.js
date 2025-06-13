import React, { useEffect, useState } from 'react';

import { CornerUpLeft } from 'lucide-react';

import { getDrawingInstructions } from './drawing/DrawingInstructions';

/**
 * Specialized tooltip for drawing mode that follows the cursor
 */
const DrawingTooltip = ({ drawingMode, tempPolygon }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!drawingMode) {
      setIsVisible(false);
      return;
    }

    const handleMouseMove = e => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [drawingMode]);

  if (!isVisible || !drawingMode) return null;

  const message = getDrawingInstructions(tempPolygon.length);
  const showIcon = tempPolygon.length >= 2;

  return (
    <div
      className="fixed pointer-events-none z-50 flex items-center bg-cream/90 backdrop-blur-sm shadow-lg rounded-lg px-3 py-2 text-sm text-forest font-medium"
      style={{
        left: position.x + 16,
        top: position.y + 16,
        transform: 'translate(0, -50%)'
      }}
    >
      {showIcon && <CornerUpLeft className="w-4 h-4 mr-2 text-sage" />}
      {message}
    </div>
  );
};

export default DrawingTooltip;
