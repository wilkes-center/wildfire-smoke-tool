import React, { useRef } from 'react';
import Map from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { MAPBOX_TOKEN } from '../../utils/map/constants.js'; 
import { BASEMAPS } from '../../constants/map/basemaps';

// Map UI Components
import MapControls from './controls'; 
import MapAdditionalControls from './panels/MapAdditionalControls';
import LoadingOverlay from './LoadingOverlay';
import AreaAnalysis from './panels/AreaAnalysis';
import DrawingTooltip from './DrawingTooltip';
import PopulationExposureCounter from './controls/PopulationExposureCounter';
import ZoomControls from './controls/ZoomControls';
import IntroTour from './IntroTour';
import TourButton from './TourButton';
import DrawingHelperOverlay from './DrawingHelperOverlay';

// Custom hooks
import {
  useMapState,
  useTimeState,
  useThemeState,
  useDrawingState,
  useUIState,
  useMapLayers,
  useTimeAnimation,
  useDateTimeCalculator,
  useMapInteraction,
  useDrawingInteraction,
  useThemeControl,
  usePolygonVisualization,
  useTourManager,
  useCensusDataManager
} from '../../hooks';

const MapComponent = () => {
  // Reference variables
  const needsLayerReinitRef = useRef(false);
  const initialSetupDone = useRef(false);
  const layerSetupComplete = useRef(false);
  
  // State management hooks
  const mapState = useMapState();
  const timeState = useTimeState();
  const themeState = useThemeState();
  const drawingState = useDrawingState();
  const uiState = useUIState();
  
  // Destructure state for easier access
  const {
    mapRef, 
    mapInstance, 
    setMapInstance, 
    isMapLoaded, 
    setIsMapLoaded, 
    viewport, 
    setViewport
  } = mapState;
  
  const {
    currentHour,
    setCurrentHour,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed
  } = timeState;
  
  const {
    isDarkMode,
    setIsDarkMode,
    currentBasemap,
    setCurrentBasemap,
    pm25Threshold,
    setPM25Threshold
  } = themeState;
  
  const {
    drawingMode,
    setDrawingMode,
    isPointSelected,
    setIsPointSelected,
    polygon,
    setPolygon,
    tempPolygon,
    setTempPolygon,
    mousePosition,
    setMousePosition,
    lastClickTime,
    setLastClickTime
  } = drawingState;
  
  const {
    showTour,
    setShowTour,
    censusLoading,
    setCensusLoading,
    censusError,
    setCensusError
  } = uiState;

  // Effects and functionality hooks
  useTimeAnimation(isPlaying, playbackSpeed, setCurrentHour);
  const getCurrentDateTime = useDateTimeCalculator(currentHour);
  
  const { updateLayers } = useMapLayers(
    mapRef,
    pm25Threshold,
    currentHour,
    isMapLoaded,
    getCurrentDateTime,
    isDarkMode,
    needsLayerReinitRef
  );

  const { handleTourComplete } = useTourManager({ 
    showTour, 
    setShowTour, 
    mapInstance, 
    isMapLoaded 
  });

  useCensusDataManager({ 
    mapInstance, 
    isMapLoaded, 
    isDarkMode, 
    setCensusLoading, 
    setCensusError
  });

  usePolygonVisualization({
    mapInstance,
    polygon,
    tempPolygon,
    mousePosition,
    drawingMode,
    isDarkMode
  });

  // Map interaction handlers
  const { handleMapInteraction, handleMapLoad } = useMapInteraction({
    mapRef,
    mapInstance,
    setMapInstance,
    setIsMapLoaded,
    isMapLoaded,
    setViewport,
    isDarkMode,
    updateLayers,
    needsLayerReinitRef,
    initialSetupDone,
    layerSetupComplete
  });

  const { 
    handleMapClick, 
    clearPolygon, 
    getCursor, 
    startDrawing, 
    finishDrawing 
  } = useDrawingInteraction({
    mapInstance,
    drawingMode,
    setDrawingMode,
    isPointSelected,
    setIsPointSelected,
    polygon,
    setPolygon,
    tempPolygon,
    setTempPolygon,
    setMousePosition,
    lastClickTime,
    setLastClickTime,
    setIsPlaying,
    showTour,
    isDarkMode
  });

  const { handleThemeChange, handleBasemapChange } = useThemeControl({
    setIsDarkMode,
    currentBasemap,
    setCurrentBasemap,
    needsLayerReinitRef,
    layerSetupComplete
  });

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
            setCurrentBasemap={handleBasemapChange}
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