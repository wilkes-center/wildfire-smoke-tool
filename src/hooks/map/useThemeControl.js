import { useCallback } from 'react';
import { BASEMAPS } from '../../constants/map/basemaps';

export const useThemeControl = ({
  setIsDarkMode,
  currentBasemap,
  setCurrentBasemap,
  needsLayerReinitRef,
  layerSetupComplete
}) => {
  // Handle theme changes
  const handleThemeChange = useCallback((darkMode) => {
    setIsDarkMode(darkMode);
    if (currentBasemap !== BASEMAPS.satellite.url) {
      setCurrentBasemap(darkMode ? BASEMAPS.darkMatter.url : BASEMAPS.light.url);
    }
    needsLayerReinitRef.current = true;
  }, [currentBasemap, setCurrentBasemap, setIsDarkMode, needsLayerReinitRef]);

  // Handle basemap changes
  const handleBasemapChange = useCallback((newBasemap) => {
    setCurrentBasemap(newBasemap);
    needsLayerReinitRef.current = true;
    layerSetupComplete.current = false;
  }, [setCurrentBasemap, needsLayerReinitRef, layerSetupComplete]);

  return {
    handleThemeChange,
    handleBasemapChange
  };
};
