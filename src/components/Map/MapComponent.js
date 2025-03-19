import React, { useState, useCallback, useEffect, useRef } from 'react';
import Map from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { START_DATE, MAPBOX_TOKEN, TILESET_INFO } from '../../utils/map/constants.js'; 
import getSelectedCensusTracts, { cleanupHighlightLayers } from '../../utils/map/censusAnalysis';
import { useMapLayers } from '../../hooks/map/useMapLayers';
import { useTimeAnimation } from '../../hooks/map/useTimeAnimation';
import MapControls from './controls'; 
import MapAdditionalControls from './panels/MapAdditionalControls';
import LoadingOverlay from './LoadingOverlay';
import AreaAnalysis from './panels/AreaAnalysis';
import { BASEMAPS } from '../../constants/map/basemaps';
import DrawingTooltip from './DrawingTooltip';
import PopulationExposureCounter from './controls/PopulationExposureCounter';
import handleEnhancedMapClick from './controls/handleEnhancedMapClick.js';
import ZoomControls from './controls/ZoomControls';
import { censusLayerManager } from '../../utils/map/CensusLayerManager';
import IntroTour from './IntroTour';
import TourButton from './TourButton';
import DrawingHelperOverlay from './DrawingHelperOverlay';

const MapComponent = () => {
  // Core map state
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [viewport, setViewport] = useState({
    latitude: 39.8283,
    longitude: -98.5795,
    zoom: 4.5,
    minZoom: 4.5,
    maxZoom: 9,
  });
  
  // Time control state
  const [currentHour, setCurrentHour] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  // Theme and appearance
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState(BASEMAPS.light.url);
  const [pm25Threshold, setPM25Threshold] = useState(1);
  
  // Drawing and selection state
  const [drawingMode, setDrawingMode] = useState(false);
  const [isPointSelected, setIsPointSelected] = useState(false);
  const [polygon, setPolygon] = useState(null);
  const [tempPolygon, setTempPolygon] = useState([]);
  const [mousePosition, setMousePosition] = useState(null);
  const [lastClickTime, setLastClickTime] = useState(0);
  
  // UI state
  const [showTour, setShowTour] = useState(true);
  const [censusLoading, setCensusLoading] = useState(false);
  const [censusError, setCensusError] = useState(null);
  
  // Refs for tracking layer state
  const needsLayerReinitRef = useRef(false);
  const initialSetupDone = useRef(false);
  const layerSetupComplete = useRef(false);
  
  // Constants
  const DOUBLE_CLICK_THRESHOLD = 300;

  // Custom hooks
  useTimeAnimation(isPlaying, playbackSpeed, setCurrentHour);
  
  const getCurrentDateTime = useCallback(() => {
    const msPerHour = 60 * 60 * 1000;
    const currentDate = new Date(START_DATE.getTime() + (currentHour * msPerHour));
    const date = currentDate.toISOString().split('T')[0];
    const hour = currentDate.getUTCHours();
  
    const currentTileset = TILESET_INFO.find(tileset => 
      tileset.date === date && 
      hour >= tileset.startHour && 
      hour <= tileset.endHour
    );
  
    if (!currentTileset) {
      return { date: '', hour: 0 };
    }
  
    return { date, hour };
  }, [currentHour]);

  const { updateLayers } = useMapLayers(
    mapRef,
    pm25Threshold,
    currentHour,
    isMapLoaded,
    getCurrentDateTime,
    isDarkMode,
    needsLayerReinitRef
  );

  // Check if tour has been completed before
  useEffect(() => {
    const tourCompleted = localStorage.getItem('tourCompleted');
    if (tourCompleted === 'true') {
      setShowTour(false);
    }
  }, []);

  // Handle map interaction (viewport changes)
  const handleMapInteraction = useCallback((evt) => {
    if (isMapLoaded) {
      setViewport(evt.viewState);
    }
  }, [isMapLoaded]);

  // Handle theme changes
  const handleThemeChange = useCallback((darkMode) => {
    setIsDarkMode(darkMode);
    if (currentBasemap !== BASEMAPS.satellite.url) {
      setCurrentBasemap(darkMode ? BASEMAPS.darkMatter.url : BASEMAPS.light.url);
    }
    needsLayerReinitRef.current = true;
  }, [currentBasemap]);

  // Handle basemap changes
  const handleBasemapChange = useCallback((newBasemap) => {
    setCurrentBasemap(newBasemap);
    needsLayerReinitRef.current = true;
    layerSetupComplete.current = false;
  }, []);

  // Handle map load
  const handleMapLoad = useCallback(() => {
    if (layerSetupComplete.current) return;
    
    console.log('Map loaded, initializing...');
    setIsMapLoaded(true);
    
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      setMapInstance(map);
      
      // Wait for style to be loaded
      if (!map.isStyleLoaded()) {
        map.once('style.load', () => {
          censusLayerManager.initializeLayer(map, isDarkMode);
        });
      } else {
        censusLayerManager.initializeLayer(map, isDarkMode);
      }
    }
  }, [isDarkMode]);

  // Handle map click
  const handleMapClick = useCallback((e) => {
    // Don't handle clicks when tour is active
    if (showTour) return;

    // First check if we're in drawing mode
    if (drawingMode) {
      const { lng, lat } = e.lngLat;
      const now = Date.now();
      
      // Check if this is a double-click based on timing
      if (now - lastClickTime < DOUBLE_CLICK_THRESHOLD && tempPolygon.length >= 2) {
        // Double click detected - finish the polygon
        const finalPolygon = [...tempPolygon, tempPolygon[0]]; // Close the polygon
        setPolygon(finalPolygon);
        setDrawingMode(false);
        setTempPolygon([]);
        setIsPlaying(true);
        
        if (mapInstance) {
          mapInstance.getCanvas().style.cursor = '';
        }
        
        setLastClickTime(0); // Reset click time
        return;
      }
      
      // Single click - add point to tempPolygon
      setTempPolygon(prev => [...prev, [lng, lat]]);
      setLastClickTime(now);
      return;
    }
    
    // Only proceed with point selection if not in drawing mode
    if (!isPointSelected && mapInstance) {
      try {
        // Existing point selection logic
        handleEnhancedMapClick(e, mapInstance, {
          initialZoomLevel: 7,
          zoomDuration: 1000,
          selectionDelay: 500,
          selectionRadius: 0.1
        }).then(selection => {
          setPolygon(selection.polygon);
          setIsPointSelected(true);
          setIsPlaying(true);
          
          // Get census data for the selected area
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
    showTour
  ]);

  // Clear polygon selection
  const clearPolygon = useCallback(() => {
    if (polygon) {
      // Clean up census highlight layers
      cleanupHighlightLayers(mapInstance);
    }
    // Clear polygon state
    setPolygon(null);
    setTempPolygon([]);
    setDrawingMode(false);
    setIsPlaying(false);
    setIsPointSelected(false);
  
    // Clear area statistics data
    const analysisComponent = document.querySelector('[data-component="area-analysis"]');
    if (analysisComponent) {
      analysisComponent.dispatchEvent(new CustomEvent('clearData'));
    }
  
    // Reset cursor
    if (mapInstance) {
      mapInstance.getCanvas().style.cursor = '';
    }
  }, [mapInstance, polygon]);

  // Get map cursor based on current state
  const getCursor = useCallback(() => {
    if (showTour) return 'default'; // Don't change cursor during tour
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
  }, [mapInstance]);

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
  }, [tempPolygon, mapInstance]);

  // Handle tour completion
  const handleTourComplete = useCallback(() => {
    setShowTour(false);
    localStorage.setItem('tourCompleted', 'true');
  }, []);

  // Set up tour attributes
  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return;
    
    const addTourAttributes = () => {
      console.log("Attempting to add tour attributes to UI elements");
      
      // Define the elements to target
      const tourElements = [
        { selector: '.fixed.bottom-4.left-1\\/2.-translate-x-1\\/2', id: 'tour-time-controls', attr: 'time-controls' },
        { selector: '.fixed.top-4 .flex.items-center.gap-4 > :first-child', id: 'tour-pm25-threshold', attr: 'pm25-threshold' },
        { selector: '.fixed.top-4 .flex.items-center.gap-4 > :nth-child(2)', id: 'tour-date-time', attr: 'date-time' },
        { selector: '.fixed.top-4 .flex.items-center.gap-4 > :nth-child(3)', id: 'tour-theme-controls', attr: 'theme-controls' },
        { selector: '.fixed.top-4 .flex.items-center.gap-4 > :nth-child(3) button', id: 'tour-draw-button', attr: 'draw-button' },
        { selector: '.fixed.left-4.bottom-4', id: 'tour-zoom-controls', attr: 'zoom-controls' }
      ];
      
      // Add attributes to each element
      let foundCount = 0;
      tourElements.forEach(item => {
        const element = document.querySelector(item.selector);
        if (element) {
          element.id = item.id;
          element.setAttribute('data-tour', item.attr);
          foundCount++;
        }
      });
      
      console.log(`Found ${foundCount} elements for tour out of ${tourElements.length} expected`);
      
      // Retry if not all elements found
      if (foundCount < tourElements.length) {
        setTimeout(addTourAttributes, 1000);
      }
    };
    
    // Add tour attributes after the UI is rendered
    setTimeout(addTourAttributes, 1000);
  }, [mapInstance, isMapLoaded]);

  // Initialize census layers
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
  
    // Cleanup function
    return () => {
      censusLayerManager.cleanup(mapInstance);
    };
  }, [mapInstance, isMapLoaded, isDarkMode]);

  // Update census layer colors on theme change
  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return;
    censusLayerManager.updateColors(mapInstance, isDarkMode);
  }, [isDarkMode, mapInstance, isMapLoaded]);

  // Handle map style changes
  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return;
  
    const handleStyleData = () => {
      if (!mapInstance.isStyleLoaded()) {
        console.log('Waiting for style to load...');
        return;
      }
  
      if (needsLayerReinitRef.current) {
        censusLayerManager.initializeLayer(mapInstance, isDarkMode);
        updateLayers(mapInstance);
        needsLayerReinitRef.current = false;
      }
    };
  
    // Handle initial setup
    if (!initialSetupDone.current) {
      handleStyleData();
      initialSetupDone.current = true;
    }
  
    // Listen for style changes
    mapInstance.on('styledata', handleStyleData);
  
    return () => {
      mapInstance.off('styledata', handleStyleData);
    };
  }, [mapInstance, isMapLoaded, isDarkMode, updateLayers]);

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
  }, [mapInstance, drawingMode]);

  // Manage double-click zoom based on drawing mode
  useEffect(() => {
    if (!mapInstance) return;
    
    // Disable double-click zoom when in drawing mode
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

  // Manage polygon drawing visualization
  useEffect(() => {
    if (!mapInstance || mapInstance._removed) return;
  
    const sourceId = 'polygon-source';
    const layerId = 'polygon-layer';
    const outlineLayerId = `${layerId}-outline`;
    const previewLayerId = `${layerId}-preview`;
    const vertexSourceId = `${sourceId}-vertices`;
    const vertexLayerId = `${layerId}-vertices`;
  
    // Initialize polygon sources and layers if they don't exist
    const initializePolygonResources = () => {
      // Set up sources
      if (!mapInstance.getSource(sourceId)) {
        mapInstance.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[]]
            }
          }
        });
      }
      
      if (!mapInstance.getSource(vertexSourceId)) {
        mapInstance.addSource(vertexSourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
      }
      
      // Set up layers
      if (!mapInstance.getLayer(layerId)) {
        mapInstance.addLayer({
          id: layerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': isDarkMode ? '#60A5FA' : '#3B82F6',
            'fill-opacity': isDarkMode ? 0.3 : 0.2
          }
        });
      }
  
      if (!mapInstance.getLayer(outlineLayerId)) {
        mapInstance.addLayer({
          id: outlineLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': isDarkMode ? '#60A5FA' : '#3B82F6',
            'line-width': 2
          }
        });
      }
  
      if (!mapInstance.getLayer(previewLayerId)) {
        mapInstance.addLayer({
          id: previewLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': isDarkMode ? '#60A5FA' : '#3B82F6',
            'line-width': 2,
            'line-dasharray': [2, 2]
          },
          layout: {
            'visibility': 'none'
          }
        });
      }
  
      if (!mapInstance.getLayer(vertexLayerId)) {
        mapInstance.addLayer({
          id: vertexLayerId,
          type: 'circle',
          source: vertexSourceId,
          paint: {
            'circle-radius': 5,
            'circle-color': isDarkMode ? '#60A5FA' : '#3B82F6',
            'circle-stroke-width': 2,
            'circle-stroke-color': 'white'
          }
        });
      }
    };
    
    // Update polygon data without recreating sources/layers
    const updatePolygonData = () => {
      // Update polygon source with current state
      if (mapInstance.getSource(sourceId)) {
        const coordinates = polygon ? [polygon] : 
          tempPolygon.length > 0 && mousePosition ? [[...tempPolygon, mousePosition, tempPolygon[0]]] : 
          tempPolygon.length > 0 ? [tempPolygon] : [[]];
            
        mapInstance.getSource(sourceId).setData({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates
          }
        });
      }
  
      // Update vertices source
      if (mapInstance.getSource(vertexSourceId)) {
        mapInstance.getSource(vertexSourceId).setData({
          type: 'FeatureCollection',
          features: tempPolygon.map(coord => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: coord
            }
          }))
        });
      }
  
      // Update preview line visibility
      if (mapInstance.getLayer(previewLayerId)) {
        const showPreview = drawingMode && mousePosition && tempPolygon.length > 0;
        mapInstance.setLayoutProperty(
          previewLayerId,
          'visibility',
          showPreview ? 'visible' : 'none'
        );
      }
  
      // Update vertex points visibility
      if (mapInstance.getLayer(vertexLayerId)) {
        mapInstance.setLayoutProperty(
          vertexLayerId, 
          'visibility', 
          tempPolygon.length > 0 ? 'visible' : 'none'
        );
      }
    };
  
    try {
      initializePolygonResources();
      updatePolygonData();
    } catch (error) {
      console.error('Error managing polygon visualization:', error);
    }
  
    // We intentionally don't clean up these resources on unmount
    // to prevent flickering when redrawing
  }, [
    mapInstance,
    polygon,
    tempPolygon,
    mousePosition,
    drawingMode,
    isDarkMode
  ]);
  
  return (
    <div className={`fixed inset-0 overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Map
        {...viewport}
        style={{ width: '100%', height: '100%' }}
        mapStyle={currentBasemap}
        mapboxAccessToken={MAPBOX_TOKEN}
        onMove={handleMapInteraction}
        ref={mapRef}
        onLoad={handleMapLoad}
        onClick={handleMapClick}
        cursor={getCursor()}
      />
      
      {!isMapLoaded && <LoadingOverlay isDarkMode={isDarkMode} />}

      {censusLoading && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg ${
          isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
        } shadow-lg z-50`}>
          Loading census data...
        </div>
      )}

      {censusError && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg ${
          isDarkMode ? 'bg-red-900/90 text-red-200' : 'bg-red-50 text-red-600'
        } shadow-lg z-50`}>
          {censusError}
        </div>
      )}
      
      {isMapLoaded && mapInstance && (
        <>
          <ZoomControls map={mapInstance} isDarkMode={isDarkMode} />
  
          {/* Left side overlays container */}
          <div className="fixed top-4 left-4 z-50">
            <div className="flex flex-col gap-2">
              {polygon && (
                <div className="w-80">
                  <div className={`backdrop-blur-sm rounded-lg shadow-lg px-4 py-3 ${
                    isDarkMode ? 'bg-gray-800/95 text-gray-200' : 'bg-white/95 text-gray-800'
                  }`}>
                    <PopulationExposureCounter
                      map={mapInstance}
                      polygon={polygon}
                      isDarkMode={isDarkMode}
                      currentDateTime={getCurrentDateTime()}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
  
          {/* Right side panels */}
          <AreaAnalysis
            map={mapInstance}
            currentDateTime={getCurrentDateTime()}
            isPlaying={isPlaying}
            polygon={polygon}
            isDarkMode={isDarkMode}
            onExpandChange={() => {}}
          />
  
          <MapAdditionalControls
            map={mapInstance}
            mapStyle={currentBasemap}
            mapboxAccessToken={MAPBOX_TOKEN}
            polygon={polygon}
            currentDateTime={getCurrentDateTime()}
            isDarkMode={isDarkMode}
            pm25Threshold={pm25Threshold}
            onExpandChange={() => {}}
          />
  
          <DrawingTooltip 
            drawingMode={drawingMode} 
            tempPolygon={tempPolygon}
          />
          
          <DrawingHelperOverlay
            drawingMode={drawingMode}
            tempPolygon={tempPolygon}
            isDarkMode={isDarkMode}
            finishDrawing={finishDrawing}
          />
            
          {/* Bottom controls */}
          <MapControls
            currentHour={currentHour}
            setCurrentHour={setCurrentHour}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            playbackSpeed={playbackSpeed}
            setPlaybackSpeed={setPlaybackSpeed}
            getCurrentDateTime={getCurrentDateTime}
            drawingMode={drawingMode}
            startDrawing={startDrawing}
            finishDrawing={finishDrawing}
            clearPolygon={clearPolygon}
            polygon={polygon}
            isDarkMode={isDarkMode}
            setIsDarkMode={handleThemeChange}
            currentBasemap={currentBasemap}
            setCurrentBasemap={setCurrentBasemap}
            basemapOptions={BASEMAPS}
            mapInstance={mapInstance}
            pm25Threshold={pm25Threshold}
            setPM25Threshold={setPM25Threshold}
          />
          
          {showTour && (
            <IntroTour 
              onComplete={handleTourComplete}
              isDarkMode={isDarkMode}
            />
          )}
          
          {!showTour && (
            <TourButton 
              onClick={() => setShowTour(true)}
              isDarkMode={isDarkMode}
            />
          )}
        </>
      )}
    </div>
  );
};

export default MapComponent;