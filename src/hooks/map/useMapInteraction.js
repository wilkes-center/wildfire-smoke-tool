import { useCallback, useEffect } from 'react';
import { censusLayerManager } from '../../utils/map/CensusLayerManager';

export const useMapInteraction = ({
  mapRef,
  mapInstance,
  setMapInstance,
  setIsMapLoaded,
  isMapLoaded,
  setViewport,
  isDarkMode,
  updateLayers,
  needsLayerReinitRef,
  initialSetupDone,
  layerSetupComplete
}) => {
  // Handle map interaction (viewport changes)
  const handleMapInteraction = useCallback((evt) => {
    if (isMapLoaded) {
      setViewport(evt.viewState);
    }
  }, [isMapLoaded, setViewport]);

  // Handle map load
  const handleMapLoad = useCallback(() => {
    if (layerSetupComplete.current) return;
    
    setIsMapLoaded(true);
    
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      setMapInstance(map);
      
      if (!map.isStyleLoaded()) {
        map.once('style.load', () => {
          censusLayerManager.initializeLayer(map, isDarkMode);
        });
      } else {
        censusLayerManager.initializeLayer(map, isDarkMode);
      }
    }
  }, [isDarkMode, mapRef, setIsMapLoaded, setMapInstance, layerSetupComplete]);

  // Handle map style changes
  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return;
  
    const handleStyleData = () => {
      if (!mapInstance.isStyleLoaded()) {
        return;
      }
  
      if (needsLayerReinitRef.current) {
        censusLayerManager.initializeLayer(mapInstance, isDarkMode);
        updateLayers(mapInstance);
        needsLayerReinitRef.current = false;
      }
    };
  
    if (!initialSetupDone.current) {
      handleStyleData();
      initialSetupDone.current = true;
    }
  
    mapInstance.on('styledata', handleStyleData);
  
    return () => {
      mapInstance.off('styledata', handleStyleData);
    };
  }, [mapInstance, isMapLoaded, isDarkMode, updateLayers, initialSetupDone, needsLayerReinitRef]);

  return {
    handleMapInteraction,
    handleMapLoad
  };
};
