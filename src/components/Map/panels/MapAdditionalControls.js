import React, { useEffect, useState, useRef } from 'react';
import { Map } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Map as MapIcon, X } from 'lucide-react';
import { TILESET_INFO } from '../../../utils/map/constants.js';
import { Tooltip } from '../Tooltip';

const MapAdditionalControls = ({ 
  map, 
  mapStyle, 
  mapboxAccessToken, 
  polygon,
  currentDateTime,
  aqiThreshold,
  onExpandChange 
}) => {
  const [minimapVisible, setMinimapVisible] = useState(false);
  const [minimapViewport, setMinimapViewport] = useState(null);
  const minimapRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const initializedRef = useRef(false);

  // Only run once when polygon is initially created
  useEffect(() => {
    if (polygon && !initializedRef.current) {
      initializedRef.current = true;
      setTimeout(() => {
        setIsExpanded(true);
        onExpandChange?.(true);
      }, 100);
    } else if (!polygon) {
      initializedRef.current = false;
      setIsExpanded(false);
      onExpandChange?.(false);
    }
  }, [polygon, onExpandChange]);

  const handleExpandToggle = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    onExpandChange?.(newExpandedState);
  };

  const setupMinimapLayers = (minimap) => {
    if (!minimap || !currentDateTime) return;

    TILESET_INFO.forEach((tileset) => {
      const sourceId = `minimap-source-${tileset.id}`;
      const layerId = `minimap-layer-${tileset.id}`;

      if (!minimap.getSource(sourceId)) {
        minimap.addSource(sourceId, {
          type: 'vector',
          url: `mapbox://${tileset.id}`,
        });
      }

      if (!minimap.getLayer(layerId)) {
        minimap.addLayer({
          id: layerId,
          type: 'circle',
          source: sourceId,
          'source-layer': tileset.layer,
          paint: {
            'circle-radius': [
              'interpolate',
              ['exponential', 3],
              ['zoom'],
              4, 25,
              5, 30,
              6, 35,
              7, 40,
              8, 45,
            ],
            'circle-color': [
              'interpolate',
              ['linear'],
              ['to-number', ['get', 'AQI'], 0],
              0, '#00e400',
              51, '#ffff00',
              101, '#ff7e00',
              151, '#ff0000',
              201, '#8f3f97',
              301, '#7e0023',
              500, '#7e0023'
            ],
            'circle-blur': 0.9,
            'circle-opacity': 0.15,
          },
        });
      }

      const time = `${currentDateTime.date}T${String(currentDateTime.hour).padStart(2, '0')}:00:00`;
      minimap.setFilter(layerId, [
        'all',
        ['==', ['get', 'time'], time],
        ['>=', ['to-number', ['get', 'AQI']], aqiThreshold]
      ]);
    });
  };

  useEffect(() => {
    if (polygon && polygon.length > 0) {
      const bounds = polygon.reduce(
        (acc, [lng, lat]) => ({
          minLng: Math.min(acc.minLng, lng),
          maxLng: Math.max(acc.maxLng, lng),
          minLat: Math.min(acc.minLat, lat),
          maxLat: Math.max(acc.maxLat, lat),
        }),
        { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity }
      );

      const center = {
        latitude: (bounds.minLat + bounds.maxLat) / 2,
        longitude: (bounds.minLng + bounds.maxLng) / 2
      };

      const latSpan = bounds.maxLat - bounds.minLat;
      const lngSpan = bounds.maxLng - bounds.minLng;
      const padding = 0.4;
      const paddedLatSpan = latSpan * (1 + padding);
      const paddedLngSpan = lngSpan * (1 + padding);

      const latZoom = Math.log2(180 / (paddedLatSpan + 0.0001));
      const lngZoom = Math.log2(360 / (paddedLngSpan + 0.0001));
      const zoom = Math.min(latZoom, lngZoom);

      const viewport = {
        ...center,
        zoom: Math.min(Math.max(zoom, 3), 10),
        minZoom: 4,
        maxZoom: 7
      };

      setMinimapViewport(viewport);
      setMinimapVisible(true);
    } else {
      setMinimapVisible(false);
    }
  }, [polygon]);

  useEffect(() => {
    if (minimapRef.current) {
      const minimap = minimapRef.current.getMap();
      if (minimap) {
        setTimeout(() => {
          minimap.resize();
        }, 300);
      }
    }
  }, [isExpanded]);

  const handleMinimapLoad = () => {
    const minimap = minimapRef.current?.getMap();
    if (minimap) {
      setupMinimapLayers(minimap);
    }
  };

  useEffect(() => {
    const minimap = minimapRef.current?.getMap();
    if (minimap && minimap.isStyleLoaded()) {
      setupMinimapLayers(minimap);
    }
  }, [currentDateTime, aqiThreshold]);

  return (
    <div 
      style={{ 
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000
      }}
    >
      <Tooltip content="Draw polygon to view area overview" position="left">
        <button
          className="bg-white/70 rounded-lg shadow-md hover:bg-gray-50/70 transition-colors"
          style={{
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: polygon ? 'pointer' : 'default',
            position: 'relative',
            backdropFilter: 'blur(8px)',
          }}
          onClick={polygon ? handleExpandToggle : undefined}
        >
          {!isExpanded ? (
            <MapIcon className="w-5 h-5 text-gray-600" />
          ) : (
            <X className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </Tooltip>
      
      {isExpanded && (
        <div
          style={{
            position: 'absolute',
            top: '56px',
            right: '0px',
            width: '480px',
            height: '400px',
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(8px)',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          {polygon && minimapVisible && minimapViewport && (
            <div className="w-full h-full">
              <div className="border-b border-gray-200/40 px-3 py-2 bg-white/30">
                <h2 className="text-xl font-bold leading-none text-gray-800">Area Overview</h2>
              </div>
              <div className="h-[360px]">
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
          )}
        </div>
      )}
    </div>
  );
};

export default MapAdditionalControls;