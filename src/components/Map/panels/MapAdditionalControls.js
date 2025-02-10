import React, { useState, useEffect, useRef, useCallback } from 'react';
import Map from 'react-map-gl';
import { Map as MapIcon, X } from 'lucide-react';
import { TILESET_INFO } from '../../../utils/map/constants.js';
import { Tooltip } from '../Tooltip';
import { getPM25ColorInterpolation } from '../../../utils/map/colors';

const MapAdditionalControls = ({ 
  map, 
  mapStyle, 
  mapboxAccessToken, 
  polygon,
  currentDateTime,
  isDarkMode,
  pm25Threshold,
  onExpandChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [minimapViewport, setMinimapViewport] = useState(null);
  const minimapRef = useRef(null);
  const layersInitializedRef = useRef(false);

  // Update viewport when polygon changes
  useEffect(() => {
    if (!polygon || polygon.length === 0) {
      setIsExpanded(false);
      onExpandChange?.(false);
      return;
    }

    // Calculate bounds from polygon vertices
    const bounds = polygon.reduce(
      (acc, [lng, lat]) => ({
        minLng: Math.min(acc.minLng, lng),
        maxLng: Math.max(acc.maxLng, lng),
        minLat: Math.min(acc.minLat, lat),
        maxLat: Math.max(acc.maxLat, lat),
      }),
      { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity }
    );

    // Add padding to bounds
    const padding = 0.5; // 50% padding
    const latSpan = (bounds.maxLat - bounds.minLat) * (1 + padding);
    const lngSpan = (bounds.maxLng - bounds.minLng) * (1 + padding);

    // Calculate center
    const center = {
      latitude: (bounds.minLat + bounds.maxLat) / 2,
      longitude: (bounds.minLng + bounds.maxLng) / 2
    };

    // Calculate appropriate zoom level
    const latZoom = Math.log2(180 / latSpan) - 1;
    const lngZoom = Math.log2(360 / lngSpan) - 1;
    const zoom = Math.min(latZoom, lngZoom, 9); // Cap zoom at 9

    setMinimapViewport({
      ...center,
      zoom: Math.max(zoom, 3), // Ensure minimum zoom of 3
      bearing: 0,
      pitch: 0
    });

    setIsExpanded(true);
    onExpandChange?.(true);
  }, [polygon, onExpandChange]);

  // Handle layer initialization and updates
  const initializeLayers = useCallback((minimap) => {
    if (!minimap || !currentDateTime || layersInitializedRef.current) return;

    try {
      // Clean up any existing layers first
      TILESET_INFO.forEach((tileset) => {
        const sourceId = `minimap-source-${tileset.id}`;
        const layerId = `minimap-layer-${tileset.id}`;

        if (minimap.getLayer(layerId)) {
          minimap.removeLayer(layerId);
        }
        if (minimap.getSource(sourceId)) {
          minimap.removeSource(sourceId);
        }
      });

      // Add new layers
      TILESET_INFO.forEach((tileset) => {
        const sourceId = `minimap-source-${tileset.id}`;
        const layerId = `minimap-layer-${tileset.id}`;

        // Add source
        minimap.addSource(sourceId, {
          type: 'vector',
          url: `mapbox://${tileset.id}`
        });

        // Add layer
        minimap.addLayer({
          id: layerId,
          type: 'circle',
          source: sourceId,
          'source-layer': tileset.layer,
          paint: {
            'circle-radius': [
              'interpolate',
              ['exponential', 2],
              ['zoom'],
              4, 2,
              5, 5,
              6, 10,
              7, 25,
              8, 50,
              9, 90
            ],
            'circle-color': getPM25ColorInterpolation(isDarkMode),
            'circle-blur': 0.85,
            'circle-opacity': isDarkMode ? 0.3 : 0.4 
          },
          layout: {
            visibility: 'none'
          }
        });
      });

      layersInitializedRef.current = true;
    } catch (error) {
      console.error('Error initializing minimap layers:', error);
      layersInitializedRef.current = false;
    }
  }, [currentDateTime]);

  // Update layer visibility and filters
  const updateLayers = useCallback(() => {
    const minimap = minimapRef.current?.getMap();
    if (!minimap || !currentDateTime || !layersInitializedRef.current) return;

    try {
      const time = `${currentDateTime.date}T${String(currentDateTime.hour).padStart(2, '0')}:00:00`;

      // Update all layers
      TILESET_INFO.forEach((tileset) => {
        const layerId = `minimap-layer-${tileset.id}`;
        if (!minimap.getLayer(layerId)) return;

        // Set filter for PM2.5 threshold
        minimap.setFilter(layerId, [
          'all',
          ['==', ['get', 'time'], time],
          ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold]
        ]);

        // Set visibility based on current time range
        const isCurrentTileset = (
          tileset.date === currentDateTime.date && 
          currentDateTime.hour >= tileset.startHour && 
          currentDateTime.hour <= tileset.endHour
        );

        minimap.setLayoutProperty(
          layerId,
          'visibility',
          isCurrentTileset ? 'visible' : 'none'
        );
      });
    } catch (error) {
      console.error('Error updating minimap layers:', error);
    }
  }, [currentDateTime, pm25Threshold]);

  // Handle map load
  const handleMinimapLoad = useCallback(() => {
    const minimap = minimapRef.current?.getMap();
    if (!minimap) return;

    minimap.on('style.load', () => {
      layersInitializedRef.current = false;
      initializeLayers(minimap);
      updateLayers();
    });

    if (minimap.isStyleLoaded()) {
      initializeLayers(minimap);
      updateLayers();
    }
  }, [initializeLayers, updateLayers]);

  // Update layers when time or threshold changes
  useEffect(() => {
    updateLayers();
  }, [updateLayers]);

  // Handle polygon overlay
  useEffect(() => {
    const minimap = minimapRef.current?.getMap();
    if (!minimap || !polygon) return;

    const sourceId = 'overview-polygon';
    const fillLayerId = 'overview-polygon-fill';
    const lineLayerId = 'overview-polygon-line';

    const addPolygonLayers = () => {
      // Remove existing layers if they exist
      [fillLayerId, lineLayerId].forEach(id => {
        if (minimap.getLayer(id)) minimap.removeLayer(id);
      });
      if (minimap.getSource(sourceId)) minimap.removeSource(sourceId);

      // Add new source and layers
      minimap.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [polygon]
          }
        }
      });

      minimap.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#3B82F6',
          'fill-opacity': 0.2
        }
      });

      minimap.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#3B82F6',
          'line-width': 2
        }
      });
    };

    if (minimap.isStyleLoaded()) {
      addPolygonLayers();
    } else {
      minimap.once('style.load', addPolygonLayers);
    }

    return () => {
      if (minimap.getLayer(lineLayerId)) minimap.removeLayer(lineLayerId);
      if (minimap.getLayer(fillLayerId)) minimap.removeLayer(fillLayerId);
      if (minimap.getSource(sourceId)) minimap.removeSource(sourceId);
    };
  }, [polygon]);

  return (
    <div className="fixed top-4 right-4 z-50">
      <Tooltip content="View area overview" position="left">
        <button
          className={`rounded-lg shadow-md transition-colors w-12 h-12 flex items-center justify-center backdrop-blur-sm ${
            isDarkMode 
              ? 'bg-gray-900/70 hover:bg-gray-800/70' 
              : 'bg-white/70 hover:bg-gray-50/70'
          }`}
          onClick={() => {
            const newState = !isExpanded;
            setIsExpanded(newState);
            onExpandChange?.(newState);
          }}
          disabled={!polygon}
        >
          {!isExpanded ? (
            <MapIcon className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          ) : (
            <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          )}
        </button>
      </Tooltip>
      
      {isExpanded && minimapViewport && (
        <div className={`absolute top-14 right-0 w-[480px] h-[400px] rounded-lg shadow-lg overflow-hidden border-2 border-[#DC4A23] ${
          isDarkMode 
            ? 'bg-gray-900/40 backdrop-blur-sm' 
            : 'bg-white/40 backdrop-blur-sm'
        }`}>
          <div className="w-full h-full">
            <div className={`border-b px-3 py-2 ${
              isDarkMode 
                ? 'border-gray-700/40 bg-gray-900/30' 
                : 'border-gray-200/40 bg-white/30'
            }`}>
              <h2 className={`text-xl font-bold leading-none ${
                isDarkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>Area Overview</h2>
            </div>
            
            <div className="h-[360px] relative">
              <Map
                ref={minimapRef}
                initialViewState={minimapViewport}
                style={{ width: '100%', height: '100%' }}
                mapStyle={mapStyle}
                mapboxAccessToken={mapboxAccessToken}
                interactive={false}
                onLoad={handleMinimapLoad}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapAdditionalControls;