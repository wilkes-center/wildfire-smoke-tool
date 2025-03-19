import { useState } from 'react';
import { BASEMAPS } from '../../constants/map/basemaps';

export const useThemeState = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState(BASEMAPS.light.url);
  const [pm25Threshold, setPM25Threshold] = useState(1);

  return {
    isDarkMode,
    setIsDarkMode,
    currentBasemap,
    setCurrentBasemap,
    pm25Threshold,
    setPM25Threshold
  };
};
