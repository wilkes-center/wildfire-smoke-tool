import { useCallback, useEffect } from 'react';
import getSelectedCensusTracts, { cleanupHighlightLayers } from '../../utils/map/censusAnalysis';
import handleEnhancedMapClick from '../../components/Map/controls/handleEnhancedMapClick.js';

export const DOUBLE_CLICK_THRESHOLD = 300;

export const useDrawingInteraction = ({
  mapInstance,
  drawingMode,
  setDrawingMode,
  isPointSelected,
  setIsPointSelected,
  polygon,
  setPolygon,
  tempPolygon,
  setTempPolygon,
  setMousePosition,
  lastClickTime,
  setLastClickTime,
  setIsPlaying,
  showTour,
  isDarkMode
}) => {
  // Handle map click
  const handleMapClick = useCallback((e) => {
    if (showTour) return;

    if (drawingMode) {
      const { lng, lat } = e.lngLat;
      const now = Date.now();
      
      if (now - lastClickTime < DOUBLE_CLICK_THRESHOLD && tempPolygon.length >= 2) {
        const finalPolygon = [...tempPolygon, tempPolygon[0]];
        setPolygon(finalPolygon);
        setDrawingMode(false);
        setTempPolygon([]);
        setIsPlaying(true);
        
        if (mapInstance) {
          mapInstance.getCanvas().style.cursor = '';
        }
        
        setLastClickTime(0);
        return;
      }
      
      setTempPolygon(prev => [...prev, [lng, lat]]);
      setLastClickTime(now);
      return;
    }
    
    if (!isPointSelected && mapInstance) {
      try {
        handleEnhancedMapClick(e, mapInstance, {
          initialZoomLevel: 7,
          zoomDuration: 1000,
          selectionDelay: 500,
          selectionRadius: 0.1
        }).then(selection => {
          setPolygon(selection.polygon);
          setIsPointSelected(true);
          setIsPlaying(true);
          
          getSelectedCensusTracts(mapInstance, selection.polygon, isDarkMode)
            .then(censusData => {
              console.log('Selected area census data:', censusData);
            });
        }).catch(error => {
          console.error('Error handling map click:', error);
        });
      } catch (error) {
        console.error('Error handling map click:', error);
      }
    }
  }, [
    drawingMode, 
    isPointSelected, 
    mapInstance, 
    isDarkMode, 
    tempPolygon, 
    lastClickTime, 
    showTour,
    setPolygon,
    setDrawingMode,
    setTempPolygon,
    setIsPlaying,
    setIsPointSelected,
    setLastClickTime
  ]);

  // Clear polygon selection
  const clearPolygon = useCallback(() => {
    if (polygon) {
      cleanupHighlightLayers(mapInstance);
    }
    setPolygon(null);
    setTempPolygon([]);
    setDrawingMode(false);
    setIsPlaying(false);
    setIsPointSelected(false);
  
    const analysisComponent = document.querySelector('[data-component="area-analysis"]');
    if (analysisComponent) {
      analysisComponent.dispatchEvent(new CustomEvent('clearData'));
    }
  
    if (mapInstance) {
      mapInstance.getCanvas().style.cursor = '';
    }
  }, [
    mapInstance, 
    polygon, 
    setPolygon, 
    setTempPolygon, 
    setDrawingMode, 
    setIsPlaying, 
    setIsPointSelected
  ]);

  // Get map cursor based on current state
  const getCursor = useCallback(() => {
    if (showTour) return 'default';
    if (drawingMode) return 'crosshair';
    if (isPointSelected) return 'not-allowed';
    return 'pointer';
  }, [drawingMode, isPointSelected, showTour]);

  // Drawing mode handlers
  const startDrawing = useCallback(() => {
    setDrawingMode(true);
    setTempPolygon([]);
    setPolygon(null);
    if (mapInstance) {
      mapInstance.getCanvas().style.cursor = 'crosshair';
    }
  }, [mapInstance, setDrawingMode, setTempPolygon, setPolygon]);

  const finishDrawing = useCallback(() => {
    if (tempPolygon.length >= 3) {
      const finalPolygon = [...tempPolygon, tempPolygon[0]];
      setPolygon(finalPolygon);
    }
    setDrawingMode(false);
    setTempPolygon([]);
    if (mapInstance) {
      mapInstance.getCanvas().style.cursor = '';
    }
  }, [tempPolygon, mapInstance, setPolygon, setDrawingMode, setTempPolygon]);

  // Track mouse position during drawing
  useEffect(() => {
    if (!mapInstance || !drawingMode) return;

    const handleMouseMove = (e) => {
      setMousePosition([e.lngLat.lng, e.lngLat.lat]);
    };

    mapInstance.on('mousemove', handleMouseMove);
    return () => {
      mapInstance.off('mousemove', handleMouseMove);
      setMousePosition(null);
    };
  }, [mapInstance, drawingMode, setMousePosition]);

  // Manage double-click zoom based on drawing mode
  useEffect(() => {
    if (!mapInstance) return;
    
    if (drawingMode) {
      mapInstance.doubleClickZoom.disable();
    } else {
      mapInstance.doubleClickZoom.enable();
    }
    
    return () => {
      if (mapInstance && !mapInstance._removed) {
        mapInstance.doubleClickZoom.enable();
      }
    };
  }, [mapInstance, drawingMode]);

  return {
    handleMapClick,
    clearPolygon,
    getCursor,
    startDrawing,
    finishDrawing
  };
};
