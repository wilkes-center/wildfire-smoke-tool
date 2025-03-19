import { useState } from 'react';

export const useDrawingState = () => {
  const [drawingMode, setDrawingMode] = useState(false);
  const [isPointSelected, setIsPointSelected] = useState(false);
  const [polygon, setPolygon] = useState(null);
  const [tempPolygon, setTempPolygon] = useState([]);
  const [mousePosition, setMousePosition] = useState(null);
  const [lastClickTime, setLastClickTime] = useState(0);

  return {
    drawingMode,
    setDrawingMode,
    isPointSelected,
    setIsPointSelected,
    polygon,
    setPolygon,
    tempPolygon,
    setTempPolygon,
    mousePosition,
    setMousePosition,
    lastClickTime,
    setLastClickTime
  };
};
