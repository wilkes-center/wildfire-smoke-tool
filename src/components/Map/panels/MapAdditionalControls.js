import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Map } from 'react-map-gl';
import { Map as MapIcon, X, Download } from 'lucide-react';
import { TILESET_INFO, TOTAL_HOURS } from '../../../utils/map/constants.js';
import { Tooltip } from '../Tooltip';

const MapAdditionalControls = ({ 
  map, 
  mapStyle, 
  mapboxAccessToken, 
  polygon,
  currentDateTime,
  aqiThreshold,
  onExpandChange,
  isPlaying,        
  setIsPlaying,       
  currentHour,       
  setCurrentHour,
  isDarkMode
}) => {
  const [minimapVisible, setMinimapVisible] = useState(false);
  const [minimapViewport, setMinimapViewport] = useState(null);
  const minimapRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const framesRef = useRef([]);
  const initializedRef = useRef(false);
  const layersInitializedRef = useRef(false);

  // Reset initialization flags when polygon changes
  useEffect(() => {
    if (!polygon) {
      initializedRef.current = false;
      layersInitializedRef.current = false;
    }
  }, [polygon]);

  const setupMinimapLayers = useCallback((minimap) => {
    if (!minimap || !currentDateTime || layersInitializedRef.current) return;

    try {
      // Clean up existing layers first
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

        minimap.addSource(sourceId, {
          type: 'vector',
          url: `mapbox://${tileset.id}`,
        });

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
              4, 15,
              5, 20,
              6, 25,
              7, 30,
              8, 50,
              9, 80,
              10, 100
            ],
            'circle-color': [
              'interpolate',
              ['linear'],
              ['coalesce', ['to-number', ['get', 'PM25'], 0], 0],
              0, '#00e400',
              12.1, '#ffff00',
              35.5, '#ff7e00',
              55.5, '#ff0000',
              150.5, '#8f3f97',
              250.5, '#7e0023'
            ],
            'circle-blur': 0.9,
            'circle-opacity': 0.15
          }
        });

        const time = `${currentDateTime.date}T${String(currentDateTime.hour).padStart(2, '0')}:00:00`;
        const filter = [
          'all',
          ['==', ['get', 'time'], time],
          ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], aqiThreshold]
        ];
        minimap.setFilter(layerId, filter);
      });

      layersInitializedRef.current = true;
    } catch (error) {
      console.error('Error setting up minimap layers:', error);
    }
  }, [currentDateTime, aqiThreshold]);

  const handleMinimapLoad = useCallback(() => {
    const minimap = minimapRef.current?.getMap();
    if (!minimap) return;

    minimap.on('style.load', () => {
      console.log('Style loaded, reinitializing layers');
      layersInitializedRef.current = false;
      setupMinimapLayers(minimap);
    });

    if (minimap.isStyleLoaded()) {
      setupMinimapLayers(minimap);
    }
  }, [setupMinimapLayers]);

  // Update layers when time or threshold changes
  useEffect(() => {
    const minimap = minimapRef.current?.getMap();
    if (minimap && minimap.isStyleLoaded()) {
      const time = `${currentDateTime.date}T${String(currentDateTime.hour).padStart(2, '0')}:00:00`;
      
      TILESET_INFO.forEach((tileset) => {
        const layerId = `minimap-layer-${tileset.id}`;
        if (minimap.getLayer(layerId)) {
          const filter = [
            'all',
            ['==', ['get', 'time'], time],
            ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], aqiThreshold]
          ];
          minimap.setFilter(layerId, filter);
        }
      });
    }
  }, [currentDateTime, aqiThreshold]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      const minimap = minimapRef.current?.getMap();
      if (minimap) {
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
      }
    };
  }, []);

  
  // Update the layers when time or threshold changes
  const updateMinimapLayers = (minimap) => {
    if (!minimap || !currentDateTime) return;
  
    try {
      TILESET_INFO.forEach((tileset) => {
        const layerId = `minimap-layer-${tileset.id}`;
        if (!minimap.getLayer(layerId)) return;
  
        const time = `${currentDateTime.date}T${String(currentDateTime.hour).padStart(2, '0')}:00:00`;
        const filter = [
          'all',
          ['==', ['get', 'time'], time],
          ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], aqiThreshold]
        ];
        minimap.setFilter(layerId, filter);
      });
    } catch (error) {
      console.error('Error updating minimap layers:', error);
    }
  };
  
  const captureFrame = async () => {
    if (!minimapRef.current) return null;
    
    try {
      const map = minimapRef.current.getMap();
      const canvas = map.getCanvas();
      
      // Create a new canvas and copy the map
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      ctx.drawImage(canvas, 0, 0);
      
      return new Promise((resolve) => {
        tempCanvas.toBlob((blob) => {
          resolve(URL.createObjectURL(blob));
        }, 'image/png');
      });
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const startRecording = async () => {
    setIsRecording(true);
    setRecordingProgress(0);
    framesRef.current = [];
    
    // Stop any ongoing playback
    setIsPlaying(false);
    setCurrentHour(0);
    
    // Wait for initial render
    await delay(1000);
    
    try {
      // Capture frames
      for (let hour = 0; hour < TOTAL_HOURS; hour++) {
        setCurrentHour(hour);
        await delay(500); // Wait for map update
        
        const frameUrl = await captureFrame();
        if (frameUrl) {
          framesRef.current.push(frameUrl);
        }
        
        setRecordingProgress((hour + 1) / TOTAL_HOURS * 100);
      }
      
      // Create and download frames as a ZIP file
      await downloadFrames();
    } catch (error) {
      console.error('Recording error:', error);
    } finally {
      // Cleanup
      framesRef.current.forEach(url => URL.revokeObjectURL(url));
      framesRef.current = [];
      setIsRecording(false);
    }
  };

  const downloadFrames = async () => {
    try {
      // Download first frame as PNG
      if (framesRef.current.length > 0) {
        const response = await fetch(framesRef.current[0]);
        const blob = await response.blob();
        
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'area-overview.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading frames:', error);
    }
  };
  
  useEffect(() => {
    if (polygon) {
      // Always expand when a new polygon is drawn
      setIsExpanded(true);
      onExpandChange?.(true);
      initializedRef.current = true;
    } else {
      setIsExpanded(false);
      onExpandChange?.(false);
      initializedRef.current = false;
    }
  }, [polygon, onExpandChange]);

  // Calculate and set viewport when polygon changes
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
        minZoom: 2,
        maxZoom: 9
      };

      setMinimapViewport(viewport);
      setMinimapVisible(true);
    } else {
      setMinimapVisible(false);
    }
  }, [polygon]);

  // Handle minimap resize when expanded
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

  // Add polygon overlay to minimap
  useEffect(() => {
    const minimap = minimapRef.current?.getMap();
    if (!minimap || !polygon) return;

    const sourceId = 'minimap-polygon-source';
    const layerId = 'minimap-polygon-layer';

    const addPolygonLayer = () => {
      if (minimap.getSource(sourceId)) {
        minimap.removeLayer(layerId);
        minimap.removeSource(sourceId);
      }

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
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#3B82F6',
          'line-width': 2
        }
      });
    };

    if (minimap.isStyleLoaded()) {
      addPolygonLayer();
    } else {
      minimap.once('style.load', addPolygonLayer);
    }

    return () => {
      if (minimap.getLayer(layerId)) {
        minimap.removeLayer(layerId);
      }
      if (minimap.getSource(sourceId)) {
        minimap.removeSource(sourceId);
      }
    };
  }, [polygon]);

  // Update layers when time or threshold changes
  useEffect(() => {
    const minimap = minimapRef.current?.getMap();
    if (minimap && minimap.isStyleLoaded()) {
      updateMinimapLayers(minimap);
    }
  }, [currentDateTime, aqiThreshold]);

  return (
    <div className="fixed top-4 right-4 z-50">
      <Tooltip content="Draw polygon to view area overview" position="left">
        <button
          className="bg-white/70 rounded-lg shadow-md hover:bg-gray-50/70 transition-colors w-12 h-12 flex items-center justify-center backdrop-blur-sm"
          onClick={polygon ? () => {
            const newExpandedState = !isExpanded;
            setIsExpanded(newExpandedState);
            onExpandChange?.(newExpandedState);
          } : undefined}
          disabled={!polygon}
        >
          {!isExpanded ? (
            <MapIcon className="w-5 h-5 text-gray-600" />
          ) : (
            <X className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </Tooltip>
      
      {isExpanded && minimapVisible && minimapViewport && (
        <div className="absolute top-14 right-0 w-[480px] h-[400px] bg-white/40 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
          <div className="w-full h-full">
            <div className="border-b border-gray-200/40 px-3 py-2 bg-white/30 flex justify-between items-center">
              <h2 className="text-xl font-bold leading-none text-gray-800">Area Overview</h2>
              {!isRecording && (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition-colors text-sm"
                  disabled={isRecording}
                >
                  <Download className="w-4 h-4" />
                  <span>Capture</span>
                </button>
              )}
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
              
              {isRecording && (
                <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">Recording...</div>
                  <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${recordingProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapAdditionalControls;