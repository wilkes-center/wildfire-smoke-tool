import React, { useState, useCallback, useEffect, useRef } from 'react';
import Map from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { START_DATE, MAPBOX_TOKEN } from '../../utils/map/constants.js'; 
import getSelectedCensusTracts, { cleanupHighlightLayers } from '../../utils/map/censusAnalysis';
import { useMapLayers } from '../../hooks/map/useMapLayers';
import { useTimeAnimation } from '../../hooks/map/useTimeAnimation';
import MapControls from './controls'; 
import MapAdditionalControls from './panels/MapAdditionalControls';
import LoadingOverlay from './LoadingOverlay';
import AreaAnalysis from './panels/AreaAnalysis';
import { BASEMAPS } from '../../constants/map/basemaps';
import { TILESET_INFO } from '../../utils/map/constants.js';
import DrawingTooltip from './DrawingTooltip';
import PopulationExposureCounter from './controls/PopulationExposureCounter';
import handleEnhancedMapClick  from './controls/handleEnhancedMapClick.js';
import ZoomControls from './controls/ZoomControls';
import { setupCensusLayers, updateCensusLayerColors } from '../../utils/map/censusLayers.js';

const MapComponent = () => {
  const mapRef = useRef(null);
  const needsLayerReinitRef = useRef(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [isPointSelected, setIsPointSelected] = useState(false);
  const [currentHour, setCurrentHour] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [viewport, setViewport] = useState({
    latitude: 39.8283,
    longitude: -98.5795,
    zoom: 4.5,
    minZoom: 4.5,
    maxZoom: 9,
  });
  const [pm25Threshold, setPM25Threshold] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState(BASEMAPS.light.url);
  const [drawingMode, setDrawingMode] = useState(false);
  const [polygon, setPolygon] = useState(null);
  const [tempPolygon, setTempPolygon] = useState([]);

  useTimeAnimation(isPlaying, playbackSpeed, setCurrentHour);

  const handleThemeChange = useCallback((darkMode) => {
    setIsDarkMode(darkMode);
    needsLayerReinitRef.current = true;
    if (currentBasemap !== BASEMAPS.satellite.url) {
      setCurrentBasemap(darkMode ? BASEMAPS.darkMatter.url : BASEMAPS.light.url);
    }
    
    // Update census layer colors when theme changes
    if (mapInstance) {
      updateCensusLayerColors(mapInstance, darkMode);
    }
  }, [currentBasemap, mapInstance]);

  const handleMapInteraction = useCallback((evt) => {
    if (isMapLoaded) {
      setViewport(evt.viewState);
    }
  }, [isMapLoaded]);

  const layerSetupComplete = useRef(false);

  const setupCensusLayers = useCallback((map, isDarkMode) => {
    if (!map || !map.getStyle() || layerSetupComplete.current) return;
  
    try {
      // Check if layers already exist
      const hasSource = map.getSource('census-tracts');
      const hasLayer = map.getLayer('census-tracts-layer');
      
      if (hasSource && hasLayer) {
        // Just update colors if needed
        map.setPaintProperty('census-tracts-layer', 'fill-color', isDarkMode ? '#374151' : '#6B7280');
        map.setPaintProperty('census-tracts-layer', 'fill-outline-color', isDarkMode ? '#4B5563' : '#374151');
        return;
      }
  
      if (!hasSource) {
        map.addSource('census-tracts', {
          type: 'vector',
          url: 'mapbox://pkulandh.3r0plqr0'
        });
      }
  
      if (!hasLayer) {
        map.addLayer({
          id: 'census-tracts-layer',
          type: 'fill',
          source: 'census-tracts',
          'source-layer': 'cb_2019_us_tract_500k-2qnt3v',
          paint: {
            'fill-color': isDarkMode ? '#374151' : '#6B7280',
            'fill-opacity': 0,
            'fill-outline-color': isDarkMode ? '#4B5563' : '#374151'
          }
        });
      }
  
      layerSetupComplete.current = true;
      console.log('Census tract layers setup complete');
    } catch (error) {
      console.error('Error setting up census tract layers:', error);
    }
  }, []);
  

  const handleMapLoad = useCallback(() => {
    if (layerSetupComplete.current) return;
    
    console.log('Map loaded, initializing...');
    setIsMapLoaded(true);
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      setMapInstance(map);
      setupCensusLayers(map, isDarkMode);
    }
  }, [isDarkMode, setupCensusLayers]);
  

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
      console.warn('No tileset found for:', { date, hour, currentHour });
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
  
  const handleBasemapChange = useCallback((newBasemap) => {
    setCurrentBasemap(newBasemap);
    needsLayerReinitRef.current = true;
    layerSetupComplete.current = false;
  }, []);

  const handleMapClick = useCallback(async (e) => {
    // If in drawing mode, handle polygon drawing
    if (drawingMode) {
      const { lng, lat } = e.lngLat;
      
      // Handle double click to complete polygon
      if (e.originalEvent.detail === 2 && tempPolygon.length >= 2) {
        const finalPolygon = [...tempPolygon, tempPolygon[0]]; // Close the polygon
        setPolygon(finalPolygon);
        setDrawingMode(false);
        setTempPolygon([]);
        setIsPlaying(true);
        
        if (mapInstance) {
          try {
            const censusData = await getSelectedCensusTracts(mapInstance, polygon, isDarkMode);
            console.log('Selected area census data:', censusData);
          } catch (error) {
            console.error('Error fetching census data:', error);
          }
        }
        return;
      }
  
      // Add point to temporary polygon
      setTempPolygon(prev => [...prev, [lng, lat]]);
      return;
    }
  
    if (!isPointSelected && mapInstance) {
      try {
        const selection = await handleEnhancedMapClick(e, mapInstance, {
          initialZoomLevel: 7,
          zoomDuration: 1000,
          selectionDelay: 500,
          selectionRadius: 0.1
        });

        setPolygon(selection.polygon);
        setIsPointSelected(true);
        setIsPlaying(true);
  
        // Get census data for the selected area
        const censusData = await getSelectedCensusTracts(mapInstance, selection.polygon);
        console.log('Selected area census data:', censusData);
      } catch (error) {
        console.error('Error handling map click:', error);
      }
    }
  }, [
    drawingMode,
    isPointSelected,
    tempPolygon,
    mapInstance,
    setIsPlaying
  ]);

  const cleanupCensusLayers = useCallback((map) => {
    if (!map) return;
  
    try {
      if (map.getLayer('census-tracts-layer')) {
        map.removeLayer('census-tracts-layer');
      }
      if (map.getSource('census-tracts')) {
        map.removeSource('census-tracts');
      }
      layerSetupComplete.current = false;
    } catch (error) {
      console.error('Error cleaning up census layers:', error);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (mapInstance) {
        cleanupCensusLayers(mapInstance);
      }
    };
  }, [mapInstance, cleanupCensusLayers]);

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
  }, [mapInstance, polygon, setIsPlaying]);


  // Update cursor based on whether point selection is allowed
  const getCursor = useCallback(() => {
    if (drawingMode) return 'crosshair';
    if (isPointSelected) return 'not-allowed';
    return 'pointer';
  }, [drawingMode, isPointSelected]);

  // Area selection controls
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

  useEffect(() => {
    if (!mapInstance) return;
  
    const handleStyleData = () => {
      if (needsLayerReinitRef.current) {
        console.log('Reinitializing layers after style change');
        layerSetupComplete.current = false; // Reset the flag when style changes
        setupCensusLayers(mapInstance, isDarkMode);
        updateLayers(mapInstance);
        needsLayerReinitRef.current = false;
      }
    };
  
    mapInstance.on('styledata', handleStyleData);
    return () => mapInstance.off('styledata', handleStyleData);
  }, [mapInstance, isDarkMode, setupCensusLayers, updateLayers]);
  

  useEffect(() => {
    if (mapInstance && isMapLoaded) {
      updateLayers(mapInstance);
      setupCensusLayers(mapInstance, isDarkMode);
    }
  }, [mapInstance, isMapLoaded, updateLayers, setupCensusLayers, isDarkMode]);

  // Polygon rendering effect
  useEffect(() => {
    if (!mapInstance || mapInstance._removed) return;

    const sourceId = 'polygon-source';
    const layerId = 'polygon-layer';
    const outlineLayerId = `${layerId}-outline`;

    const cleanup = () => {
      if (mapInstance && !mapInstance._removed) {
        if (mapInstance.getLayer(outlineLayerId)) {
          mapInstance.removeLayer(outlineLayerId);
        }
        if (mapInstance.getLayer(layerId)) {
          mapInstance.removeLayer(layerId);
        }
        if (mapInstance.getSource(sourceId)) {
          mapInstance.removeSource(sourceId);
        }
      }
    };

    cleanup();

    if (polygon || tempPolygon.length > 0) {
      try {
        mapInstance.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [polygon || [...tempPolygon, tempPolygon[0]]]
            }
          }
        });

        mapInstance.addLayer({
          id: layerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': isDarkMode ? '#60A5FA' : '#3B82F6',
            'fill-opacity': 0.2,
          }
        });

        mapInstance.addLayer({
          id: outlineLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': isDarkMode ? '#60A5FA' : '#3B82F6',
            'line-width': 3,
          }
        });
      } catch (error) {
        console.error('Error adding polygon layers:', error);
      }
    }

    return cleanup;
  }, [mapInstance, polygon, tempPolygon, isDarkMode]);

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
            onExpandChange={(expanded) => {
            }}
          />
  
          <MapAdditionalControls
            map={mapInstance}
            mapStyle={currentBasemap}
            mapboxAccessToken={MAPBOX_TOKEN}
            polygon={polygon}
            currentDateTime={getCurrentDateTime()}
            isDarkMode={isDarkMode}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            currentHour={currentHour}
            setCurrentHour={setCurrentHour}
            onExpandChange={(expanded) => {
            }}
          />
  
          <DrawingTooltip 
            drawingMode={drawingMode} 
            tempPolygon={tempPolygon}
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
        </>
      )}
    </div>
  );
};

export default MapComponent;