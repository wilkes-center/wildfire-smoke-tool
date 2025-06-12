import React, { useRef } from 'react';
import Map from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { HelpCircle } from 'lucide-react';

import { DEFAULT_DARK_BASEMAP, DEFAULT_LIGHT_BASEMAP } from '../../constants/map/basemaps.js';
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
import { MAPBOX_TOKEN } from '../../utils/map/constants.js';

// Map UI Components
import MapControls from './controls';
import PM25Legend from './controls/PM25LegendVertical';
import PM25ThresholdSlider from './controls/PM25ThresholdSlider';
import PopulationExposureCounter from './controls/PopulationExposureCounter';
import ZoomControls from './controls/ZoomControls';
import DrawingHelperOverlay from './DrawingHelperOverlay';
import DrawingTooltip from './DrawingTooltip';
import IntroTour from './IntroTour';
import LoadingOverlay from './LoadingOverlay';
import AreaAnalysis from './panels/AreaAnalysis';
import MapAdditionalControls from './panels/MapAdditionalControls';
import RightPanelControls from './panels/RightPanelControls';

// Custom hooks

const MapComponent = ({ onShowIntro }) => {
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

  const { currentHour, setCurrentHour, isPlaying, setIsPlaying, playbackSpeed, setPlaybackSpeed } =
    timeState;

  const { isDarkMode, setIsDarkMode, pm25Threshold, setPM25Threshold } = themeState;

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

  const { showTour, setShowTour, censusLoading, setCensusLoading, censusError, setCensusError } =
    uiState;

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

  const { handleMapClick, clearPolygon, getCursor, startDrawing, finishDrawing } =
    useDrawingInteraction({
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

  const { handleThemeChange } = useThemeControl({
    setIsDarkMode,
    needsLayerReinitRef,
    layerSetupComplete
  });

  // Using standard map styles to avoid feature namespace warnings
  const mapStyle = isDarkMode ? DEFAULT_DARK_BASEMAP : DEFAULT_LIGHT_BASEMAP;

  return (
    <div className={`fixed inset-0 overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Map
        {...viewport}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        onMove={handleMapInteraction}
        ref={mapRef}
        onLoad={handleMapLoad}
        onClick={handleMapClick}
        cursor={getCursor()}
        projection="globe"
      />

      {!isMapLoaded && <LoadingOverlay isDarkMode={isDarkMode} />}

      {censusLoading && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg ${
            isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
          } shadow-lg z-50`}
        >
          Loading census data...
        </div>
      )}

      {censusError && console.error('Census data error:', censusError)}

      {isMapLoaded && mapInstance && (
        <>
          <ZoomControls map={mapInstance} isDarkMode={isDarkMode} />

          {/* Left side panels container - PM2.5 controls and population counter */}
          <div className="fixed top-4 left-4 z-50 flex flex-col gap-2 pointer-events-auto">
            {/* PM2.5 Controls - always visible */}
            <div className="flex flex-col gap-2">
              <PM25ThresholdSlider
                pm25Threshold={pm25Threshold}
                setPM25Threshold={setPM25Threshold}
                isDarkMode={isDarkMode}
              />
              <PM25Legend isDarkMode={isDarkMode} />
            </div>

            {/* Population Exposure Panel - only when polygon exists */}
            {polygon && (
              <div className="w-80">
                <PopulationExposureCounter
                  map={mapInstance}
                  polygon={polygon}
                  isDarkMode={isDarkMode}
                  currentDateTime={getCurrentDateTime()}
                  isPlaying={isPlaying}
                />
              </div>
            )}
          </div>

          {/* Right-side panels with text buttons */}
          <div className="fixed top-4 right-4 z-50">
            <RightPanelControls
              map={mapInstance}
              mapStyle={mapStyle}
              mapboxAccessToken={MAPBOX_TOKEN}
              currentDateTime={getCurrentDateTime()}
              isPlaying={isPlaying}
              polygon={polygon}
              isDarkMode={isDarkMode}
              pm25Threshold={pm25Threshold}
            />
          </div>

          {/* Drawing Tooltip */}
          <DrawingTooltip drawingMode={drawingMode} tempPolygon={tempPolygon} />

          {/* Drawing Helper Overlay */}
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
            mapInstance={mapInstance}
            pm25Threshold={pm25Threshold}
            setPM25Threshold={setPM25Threshold}
            setDrawingMode={setDrawingMode}
            setTempPolygon={setTempPolygon}
          />

          {/* Intro Tour */}
          {showTour && <IntroTour onComplete={handleTourComplete} isDarkMode={isDarkMode} />}

          {/* Help Button */}
          {!showTour && (
            <div className="fixed z-50 right-4 bottom-4">
              <button
                onClick={onShowIntro}
                className={`w-12 h-12 rounded-full shadow-lg backdrop-blur-sm flex items-center justify-center transition-all ${
                  isDarkMode
                    ? 'bg-mahogany/90 hover:bg-mahogany/80 text-white border-2 border-white/50'
                    : 'bg-white/90 hover:bg-gray-50/90 text-mahogany border-2 border-mahogany/50'
                } hover:scale-110 font-sora`}
                title="Show introduction page"
              >
                <HelpCircle className="w-6 h-6" />
              </button>
            </div>
          )}
        </>
      )}

      {/* TraceAQ Logo Footer */}
      <div className="fixed left-2 bottom-8 z-40">
        <a
          href="https://www.traceaq.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="block hover:scale-105 transition-transform duration-200"
        >
          <img
            src={`${process.env.PUBLIC_URL}/TraceAQ.png`}
            alt="TraceAQ Logo"
            className="h-20 opacity-80 hover:opacity-100 transition-opacity duration-200"
          />
        </a>
      </div>
    </div>
  );
};

export default MapComponent;
