import { useState, useRef } from 'react';

const INITIAL_VIEWPORT = {
  latitude: 39.8283,
  longitude: -98.5795,
  zoom: 4,
  minZoom: 4.5,
  maxZoom: 9
};

export const useMapState = () => {
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [viewport, setViewport] = useState(INITIAL_VIEWPORT);

  return {
    mapRef,
    mapInstance,
    setMapInstance,
    isMapLoaded,
    setIsMapLoaded,
    viewport,
    setViewport
  };
};
