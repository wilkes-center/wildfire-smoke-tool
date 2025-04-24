import { useCallback } from 'react';

export const useThemeControl = ({
  setIsDarkMode,
  needsLayerReinitRef,
  layerSetupComplete
}) => {
  // Handle theme changes
  const handleThemeChange = useCallback((darkMode) => {
    setIsDarkMode(darkMode);
    needsLayerReinitRef.current = true;
  }, [setIsDarkMode, needsLayerReinitRef]);

  return {
    handleThemeChange
  };
};
