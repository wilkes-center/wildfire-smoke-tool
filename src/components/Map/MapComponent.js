import React, { useState, useCallback, useEffect, useRef } from 'react';
import Map from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { START_DATE, END_DATE, TOTAL_HOURS, MAPBOX_TOKEN } from '../../utils/map/constants.js'; 

import { useMapLayers } from '../../hooks/map/useMapLayers';
import { useTimeAnimation } from '../../hooks/map/useTimeAnimation';
import MapControls from './controls'; 
import MapAdditionalControls from './panels/MapAdditionalControls';
import LoadingOverlay from './LoadingOverlay';
import AreaAnalysis from './panels/AreaAnalysis';
import {BASEMAPS} from '../../constants/map/basemaps';
import { TILESET_INFO } from '../../utils/map/constants.js';


const MapComponent = () => {
  // Base viewport config
  const baseViewport = {
    latitude: 39.8283,
    longitude: -98.5795,
    zoom: 4,
    minZoom: 4,
    maxZoom: 15,
  };

  // Base state
  const mapRef = useRef(null);
  const [isPointSelected, setIsPointSelected] = useState(false);

  const [currentHour, setCurrentHour] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  useTimeAnimation(isPlaying, playbackSpeed, setCurrentHour);
  const [viewport, setViewport] = useState(baseViewport);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [aqiThreshold, setAqiThreshold] = useState(20);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  // Theme and basemap state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState(BASEMAPS.light.url);

  // Area selection state
  const [drawingMode, setDrawingMode] = useState(false);
  const [polygon, setPolygon] = useState(null);
  const [tempPolygon, setTempPolygon] = useState([]);

  // Map event handlers
  const handleMapLoad = useCallback(() => {
    setIsMapLoaded(true);
    if (mapRef.current) {
      setMapInstance(mapRef.current.getMap());
    }
  }, []);

  const handleMapInteraction = useCallback((evt) => {
    if (isMapLoaded) {
      setViewport(evt.viewState);
    }
  }, [isMapLoaded]);

  const handlePanelExpandChange = useCallback((expanded) => {
    setIsPanelExpanded(expanded);
  }, []);


  const getCurrentDateTime = useCallback(() => {
    // Use TILESET_INFO to determine the correct date and hour
    const hoursPerTileset = 6;
    const tilesetIndex = Math.floor(currentHour / hoursPerTileset);
    const hourOffset = currentHour % hoursPerTileset;
    
    // Get the tileset for the current time
    const tileset = TILESET_INFO[tilesetIndex];
    
    if (!tileset) {
      console.warn('No tileset found for hour:', currentHour);
      return { date: '', hour: 0 };
    }
  
    return {
      date: tileset.date,
      hour: tileset.startHour + hourOffset
    };
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

  // Map click handler
  const handleMapClick = useCallback((e) => {
    // If a point is already selected, ignore new clicks
    if (isPointSelected && !drawingMode) {
      return;
    }

    const { lng, lat } = e.lngLat;
    const point = [lng, lat];

    if (drawingMode) {
      // Handle polygon drawing
      if (e.originalEvent.detail === 2 && tempPolygon.length >= 2) {
        const finalPolygon = [...tempPolygon, tempPolygon[0]];
        setPolygon(finalPolygon);
        setDrawingMode(false);
        setTempPolygon([]);
        setIsPlaying(true);
        return;
      }
      setTempPolygon(prev => [...prev, point]);
    } else {
      // Single point selection
      const circlePolygon = createCirclePolygon(point, 0.1);
      setPolygon(circlePolygon);
      setIsPointSelected(true);
      setIsPlaying(true);

      // Auto-zoom to selection
      if (mapInstance) {
        const bounds = circlePolygon.reduce(
          (bounds, coord) => bounds.extend(coord),
          new mapboxgl.LngLatBounds(point, point)
        );
        
        mapInstance.fitBounds(bounds, {
          padding: 50,
          maxZoom: 7,
          duration: 1000
        });
      }
    }
  }, [drawingMode, isPointSelected, tempPolygon, mapInstance, createCirclePolygon, setIsPlaying]);

  // Update the clearPolygon function
  const clearPolygon = useCallback(() => {
    setPolygon(null);
    setTempPolygon([]);
    setDrawingMode(false);
    setIsPointSelected(false); // Reset point selection state
    setIsPlaying(false);
    if (mapInstance) {
      mapInstance.getCanvas().style.cursor = '';
    }
  }, [mapInstance, setIsPlaying]);

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
    aqiThreshold, 
    currentHour, 
    isMapLoaded, 
    getCurrentDateTime
  );


  // Effects
  useEffect(() => {
    if (mapInstance && isMapLoaded) {
      updateLayers(mapInstance);
    }
  }, [updateLayers, isMapLoaded, mapInstance, currentHour, aqiThreshold]);

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
            'line-width': 2,
          }
        });
      } catch (error) {
        console.error('Error adding polygon layers:', error);
      }
    }

    return cleanup;
  }, [mapInstance, polygon, tempPolygon, isDarkMode]);

  return (
    <div className={`relative w-screen h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
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
          <AreaAnalysis 
            map={mapInstance} 
            currentDateTime={getCurrentDateTime()}
            isPlaying={isPlaying}
            polygon={polygon}
            onExpandChange={handlePanelExpandChange}
            isDarkMode={isDarkMode}
          />
          <MapAdditionalControls
            map={mapInstance}
            mapStyle={currentBasemap}
            mapboxAccessToken={MAPBOX_TOKEN}
            polygon={polygon}
            currentDateTime={getCurrentDateTime()}
            aqiThreshold={aqiThreshold}
            onExpandChange={handlePanelExpandChange}
            isDarkMode={isDarkMode}
            isPlaying={isPlaying}           
            setIsPlaying={setIsPlaying}    
            currentHour={currentHour}       
            setCurrentHour={setCurrentHour}
          />
        </>
      )}
      
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
      />
    </div>
  );
};

export default MapComponent;