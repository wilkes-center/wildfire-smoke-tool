import { useEffect } from 'react';
import { censusLayerManager } from '../../utils/map/CensusLayerManager';

export const useCensusDataManager = ({ 
  mapInstance, 
  isMapLoaded, 
  isDarkMode, 
  setCensusLoading, 
  setCensusError 
}) => {
  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return;
  
    const initializeCensusLayer = async () => {
      setCensusLoading(true);
      setCensusError(null);
  
      try {
        await censusLayerManager.preloadAll(mapInstance, isDarkMode);
      } catch (error) {
        console.error('Failed to initialize census layer:', error);
        setCensusError(error.message);
      } finally {
        setCensusLoading(false);
      }
    };
  
    initializeCensusLayer();
  
    return () => {
      censusLayerManager.cleanup(mapInstance);
    };
  }, [mapInstance, isMapLoaded, isDarkMode, setCensusLoading, setCensusError]);

  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return;
    censusLayerManager.updateColors(mapInstance, isDarkMode);
  }, [isDarkMode, mapInstance, isMapLoaded]);
};
