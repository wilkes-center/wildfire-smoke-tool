import React, { useState, useCallback, useEffect, useRef } from 'react';
import Map from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { START_DATE, MAPBOX_TOKEN } from '../../utils/map/constants.js'; 
import { fetchCensusPopulation, getPopulationLayerConfig, getPopupContent } from '../../utils/map/census-api';
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
import PM25ThresholdSlider from './controls/PM25ThresholdSlider';

const MapComponent = () => {
  const baseViewport = {
    latitude: 39.8283,
    longitude: -98.5795,
    zoom: 5,
    minZoom: 5,
    maxZoom: 9,
  };

  const mapRef = useRef(null);
  const [isPointSelected, setIsPointSelected] = useState(false);

  const [currentHour, setCurrentHour] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  useTimeAnimation(isPlaying, playbackSpeed, setCurrentHour);
  const [viewport, setViewport] = useState(baseViewport);
  const [pm25Threshold, setPM25Threshold] = useState(0);
  const [aqiThreshold, setAqiThreshold] = useState(0);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  // Theme and basemap state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState(BASEMAPS.light.url);

  // Area selection state
  const [drawingMode, setDrawingMode] = useState(false);
  const [polygon, setPolygon] = useState(null);
  const [tempPolygon, setTempPolygon] = useState([]);


  const handleMapInteraction = useCallback((evt) => {
    if (isMapLoaded) {
      setViewport(evt.viewState);
    }
  }, [isMapLoaded]);



  const setupPopulationLayers = async (map) => {
    try {
      console.log('Setting up population layers...');
      // Get configuration
      const config = getPopulationLayerConfig();
      
      // Add source if it doesn't exist
      if (!map.getSource(config.source.id)) {
        console.log('Adding census source:', config.source.id);
        map.addSource(config.source.id, config.source);
      }
  
      // Add layers
      for (const layer of config.layers) {
        if (!map.getLayer(layer.id)) {
          console.log('Adding census layer:', layer.id);
          map.addLayer(layer);
        }
      }
  
      console.log('Census layers added, fetching population data...');
  
      try {
        // Fetch population data
        const populationData = await fetchCensusPopulation();
        console.log('Population data fetched successfully');
        return populationData;
      } catch (error) {
        console.error('Failed to fetch population data:', error);
        // Continue with map display even if population data fetch fails
        return null;
      }
  
    } catch (error) {
      console.error('Error setting up population layers:', error);
      throw error;
    }
  };
  
  // Update your handleMapLoad
  const handleMapLoad = useCallback(() => {
    console.log('Map loaded, initializing...');
    setIsMapLoaded(true);
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      setMapInstance(map);
      
      // Setup population layers
      setupPopulationLayers(map).catch(error => {
        console.error('Failed to setup population layers:', error);
        // Map can still function without population data
      });
    }
  }, []);

  const getCurrentDateTime = useCallback(() => {
    // Calculate the actual date and hour from START_DATE
    const msPerHour = 60 * 60 * 1000;
    const currentDate = new Date(START_DATE.getTime() + (currentHour * msPerHour));
    const date = currentDate.toISOString().split('T')[0];
    const hour = currentDate.getUTCHours();

    // Find the correct tileset for this date and hour
    const currentTileset = TILESET_INFO.find(tileset => 
        tileset.date === date && 
        hour >= tileset.startHour && 
        hour < tileset.startHour + 3
    );

    if (!currentTileset) {
        console.warn('No tileset found for:', { date, hour, currentHour });
        return { date: '', hour: 0 };
    }

    // For debugging
    /* console.log('Tileset match:', {
        date,
        hour,
        tilesetId: currentTileset.id,
        tilesetStart: currentTileset.startHour,
        tilesetEnd: currentTileset.startHour + 3
    }); */

    return { date, hour };
}, [currentHour]);

  // Area selection helpers
  const createCirclePolygon = useCallback((center, radiusDegrees) => {
    const points = 64;
    const coords = [];
    
    for (let i = 0; i <= points; i++) {
      const angle = (i * 360) / points;
      const dx = radiusDegrees * Math.cos((angle * Math.PI) / 180);
      const dy = radiusDegrees * Math.sin((angle * Math.PI) / 180);
      coords.push([center[0] + dx, center[1] + dy]);
    }
    
    coords.push(coords[0]);
    return coords;
  }, []);

  const handleMapClick = useCallback(async (e) => {
    const { lng, lat } = e.lngLat;
    const point = [lng, lat];
  
    // Handle point selection mode (when not in drawing mode)
    if (!drawingMode) {
      if (!isPointSelected) {
        const circlePolygon = createCirclePolygon(point, 0.1);
        setPolygon(circlePolygon);
        setIsPointSelected(true);
        setIsPlaying(true);
  
        if (mapInstance) {
          try {
            const censusData = await getSelectedCensusTracts(mapInstance, circlePolygon);
            console.log('Selected area census data:', censusData);
          } catch (error) {
            console.error('Error fetching census data:', error);
          }
        }
      }
      return;
    }
  
    // Handle polygon drawing mode
    if (drawingMode) {
      if (e.originalEvent.detail === 2 && tempPolygon.length >= 2) {
        const finalPolygon = [...tempPolygon, tempPolygon[0]];
        setPolygon(finalPolygon);
        setDrawingMode(false);
        setTempPolygon([]);
        setIsPlaying(true);
        
        if (mapInstance) {
          try {
            const censusData = await getSelectedCensusTracts(mapInstance, finalPolygon);
            console.log('Selected area census data:', censusData);
            // Removed zoom/fit bounds logic to maintain current view
          } catch (error) {
            console.error('Error fetching census data:', error);
          }
        }
        return;
      }
  
      setTempPolygon(prev => [...prev, point]);
    }
  }, [
    drawingMode,
    isPointSelected,
    tempPolygon,
    mapInstance,
    createCirclePolygon,
    setIsPlaying
  ]);


  const clearPolygon = useCallback(() => {
    if (polygon) {
      cleanupHighlightLayers(mapInstance, polygon);
    }
    setPolygon(null);
    setTempPolygon([]);
    setDrawingMode(false);
    setIsPlaying(false);
    setIsPointSelected(false);
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

  // Theme handling
  const handleThemeChange = useCallback((darkMode) => {
    setIsDarkMode(darkMode);
    // Auto switch basemap if not in satellite mode
    if (currentBasemap !== BASEMAPS.satellite.url) {
      setCurrentBasemap(darkMode ? BASEMAPS.dark.url : BASEMAPS.light.url);
    }
  }, [currentBasemap]);

  // Hooks
  const { updateLayers } = useMapLayers(
    mapRef, 
    pm25Threshold, 
    currentHour, 
    isMapLoaded, 
    getCurrentDateTime
  );


  // Effects
  useEffect(() => {
    if (mapInstance && isMapLoaded) {
      updateLayers(mapInstance);
    }
  }, [updateLayers, isMapLoaded, mapInstance, currentHour, pm25Threshold]);

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

          {/* Right side overlays */}
          <AreaAnalysis 
            map={mapInstance} 
            currentDateTime={getCurrentDateTime()}
            isPlaying={isPlaying}
            polygon={polygon}
            isDarkMode={isDarkMode}
          />
          <MapAdditionalControls
            map={mapInstance}
            mapStyle={currentBasemap}
            mapboxAccessToken={MAPBOX_TOKEN}
            polygon={polygon}
            currentDateTime={getCurrentDateTime()}
            aqiThreshold={aqiThreshold}
            isDarkMode={isDarkMode}
            isPlaying={isPlaying}           
            setIsPlaying={setIsPlaying}    
            currentHour={currentHour}       
            setCurrentHour={setCurrentHour}
          />
        </>
      )}

      <DrawingTooltip 
        drawingMode={drawingMode} 
        tempPolygon={tempPolygon}
      />

      <MapControls
        currentHour={currentHour}
        setCurrentHour={setCurrentHour}
        aqiThreshold={aqiThreshold}
        setAqiThreshold={setAqiThreshold}
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
    </div>
);
};

export default MapComponent;