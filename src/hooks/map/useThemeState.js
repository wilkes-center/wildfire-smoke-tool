import { useState } from 'react';

export const useThemeState = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pm25Threshold, setPM25Threshold] = useState(5);

  return {
    isDarkMode,
    setIsDarkMode,
    pm25Threshold,
    setPM25Threshold
  };
};
