import React, { useState, useCallback, useEffect, useRef } from 'react';
import Map from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, TILESET_INFO, START_DATE, END_DATE, SKIPPED_HOURS, TOTAL_HOURS } from './constants';
import { useMapLayers } from './hooks/useMapLayers';
import { useTimeAnimation } from './hooks/useTimeAnimation';
import MapControls from './MapControls';
import LoadingOverlay from './LoadingOverlay';
import AreaAnalysis from './AreaAnalysis';

const MapComponent = () => {
  const [viewport, setViewport] = useState({
    latitude: 39.8283,
    longitude: -98.5795,
    zoom: 4,
    minZoom: 4,
    maxZoom: 8,
  });

  const [currentHour, setCurrentHour] = useState(0);
  const [aqiThreshold, setAqiThreshold] = useState(0);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);

  const getCurrentDateTime = useCallback(() => {
    let adjustedHour = currentHour;
    if (adjustedHour >= 12) { 
      adjustedHour += SKIPPED_HOURS;
    }
    const currentDate = new Date(START_DATE.getTime() + adjustedHour * 60 * 60 * 1000);
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
      const map = mapRef.current.getMap();
      setMapInstance(map);
    }
    console.log('Map loaded');
  }, []);

  const handleMapInteraction = useCallback((evt) => {
    if (isMapLoaded) {
      setViewport(evt.viewState);
    }
  }, [isMapLoaded]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (map && isMapLoaded) {
      updateLayers(map);
    }
  }, [updateLayers, isMapLoaded, currentHour]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <Map
          {...viewport}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/light-v10"
          mapboxAccessToken={MAPBOX_TOKEN}
          onMove={handleMapInteraction}
          ref={mapRef}
          onLoad={handleMapLoad}
        />
        {!isMapLoaded && <LoadingOverlay />}
      </div>
      {isMapLoaded && mapInstance && (
        <AreaAnalysis 
          map={mapInstance} 
          currentDateTime={getCurrentDateTime()}
          isPlaying={isPlaying}
        />
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
      />
    </div>
  );
};

export default MapComponent;