import React, { useState, useCallback, useEffect, useRef } from 'react';
import Map from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, START_DATE } from './constants';
import { useMapLayers } from './hooks/useMapLayers';
import { useTimeAnimation } from './hooks/useTimeAnimation';
import MapControls from './MapControls';
import MapAdditionalControls from './MapAdditionalControls';
import LoadingOverlay from './LoadingOverlay';
import AreaAnalysis from './AreaAnalysis';

const MapComponent = () => {
  // Base viewport for when panels are collapsed
  const baseViewport = {
    latitude: 39.8283,
    longitude: -98.5795,
    zoom: 4,
    minZoom: 4,
    maxZoom: 8,
  };

  // Adjusted viewport for when panels are expanded
  const expandedViewport = {
    ...baseViewport,
    longitude: -85.5795, // Shifted west to show more of the east coast
  };

  const [viewport, setViewport] = useState(baseViewport);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [currentHour, setCurrentHour] = useState(0);
  const [aqiThreshold, setAqiThreshold] = useState(0);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);

  // Drawing state
  const [drawingMode, setDrawingMode] = useState(false);
  const [polygon, setPolygon] = useState(null);
  const [tempPolygon, setTempPolygon] = useState([]);

  const getCurrentDateTime = useCallback(() => {
    const currentDate = new Date(START_DATE.getTime() + currentHour * 60 * 60 * 1000);
    return {
      date: currentDate.toISOString().split('T')[0],
      hour: currentDate.getHours(),
    };
  }, [currentHour]);

  const { updateLayers } = useMapLayers(mapRef, aqiThreshold, currentHour, isMapLoaded, getCurrentDateTime);

  useTimeAnimation(isPlaying, playbackSpeed, setCurrentHour);

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

  // Update layers when necessary
  useEffect(() => {
    if (mapInstance && isMapLoaded) {
      updateLayers(mapInstance);
    }
  }, [updateLayers, isMapLoaded, mapInstance, currentHour, aqiThreshold]);

  // Simplified reset view function
  const resetView = useCallback(() => {
    return new Promise((resolve) => {
      if (mapInstance) {
        mapInstance.easeTo({
          center: [baseViewport.longitude, baseViewport.latitude],
          zoom: baseViewport.zoom,
          duration: 1000,
          onComplete: () => {
            updateLayers(mapInstance);
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }, [mapInstance, updateLayers]);

  // Simplified expand view function
  const expandView = useCallback(() => {
    if (mapInstance) {
      mapInstance.easeTo({
        center: [expandedViewport.longitude, expandedViewport.latitude],
        zoom: expandedViewport.zoom,
        duration: 500,
        onComplete: () => {
          updateLayers(mapInstance);
        }
      });
    }
  }, [mapInstance, updateLayers]);

  // Handle panel expansion state changes
  const handlePanelExpandChange = useCallback((expanded) => {
    setIsPanelExpanded(expanded);
    if (expanded) {
      expandView();
    } else {
      setViewport(baseViewport);
      if (mapInstance) {
        mapInstance.easeTo({
          center: [baseViewport.longitude, baseViewport.latitude],
          duration: 300,
          onComplete: () => {
            updateLayers(mapInstance);
          }
        });
      }
    }
  }, [mapInstance, expandView, updateLayers]);

  const startDrawing = useCallback(() => {
    setDrawingMode(true);
    setTempPolygon([]);
    setPolygon(null);
    if (mapInstance) {
      mapInstance.getCanvas().style.cursor = 'crosshair';
    }
  }, [mapInstance]);

  const handleMapClick = useCallback((e) => {
    if (!drawingMode) return;
    const { lng, lat } = e.lngLat;
    setTempPolygon(prev => [...prev, [lng, lat]]);
  }, [drawingMode]);

  const finishDrawing = useCallback(async () => {
    if (tempPolygon.length >= 3) {
      setPolygon([...tempPolygon, tempPolygon[0]]);
      setDrawingMode(false);
      setTempPolygon([]);
      setIsPlaying(true); // Start playing automatically
      
      if (mapInstance) {
        mapInstance.getCanvas().style.cursor = '';
        
        await resetView();
        setIsPanelExpanded(true);
        setTimeout(() => {
          expandView();
        }, 100);
      }
    }
  }, [tempPolygon, mapInstance, resetView, expandView, setIsPlaying]);

  const clearPolygon = useCallback(() => {
    setPolygon(null);
    setTempPolygon([]);
    setIsPanelExpanded(false);
    setIsPlaying(false); // Pause when clearing polygon
    if (mapInstance) {
      mapInstance.easeTo({
        center: [baseViewport.longitude, baseViewport.latitude],
        duration: 300,
        onComplete: () => {
          updateLayers(mapInstance);
        }
      });
    }
  }, [mapInstance, updateLayers, setIsPlaying]);

  // Map click handler
  useEffect(() => {
    if (mapInstance) {
      mapInstance.on('click', handleMapClick);
      return () => {
        if (mapInstance && !mapInstance._removed) {
          mapInstance.off('click', handleMapClick);
        }
      };
    }
  }, [mapInstance, handleMapClick]);

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
            'fill-color': 'blue',
            'fill-opacity': 0.2,
          }
        });

        mapInstance.addLayer({
          id: outlineLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': 'blue',
            'line-width': 2,
          }
        });
      } catch (error) {
        console.error('Error adding polygon layers:', error);
      }
    }

    return cleanup;
  }, [mapInstance, polygon, tempPolygon]);

  return (
    <div className="relative w-screen h-screen">
      <Map
        {...viewport}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        mapboxAccessToken={MAPBOX_TOKEN}
        onMove={handleMapInteraction}
        ref={mapRef}
        onLoad={handleMapLoad}
      />
      {!isMapLoaded && <LoadingOverlay />}
      
      {isMapLoaded && mapInstance && (
        <>
          <AreaAnalysis 
            map={mapInstance} 
            currentDateTime={getCurrentDateTime()}
            isPlaying={isPlaying}
            polygon={polygon}
            onExpandChange={handlePanelExpandChange}
          />
          <MapAdditionalControls
            map={mapInstance}
            mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
            mapboxAccessToken={MAPBOX_TOKEN}
            polygon={polygon}
            currentDateTime={getCurrentDateTime()}
            aqiThreshold={aqiThreshold}
            onExpandChange={handlePanelExpandChange}
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
        map={mapInstance}
      />
    </div>
  );
};

export default MapComponent;