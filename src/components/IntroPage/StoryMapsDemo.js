import React, { useCallback, useEffect, useRef, useState } from 'react';

import 'mapbox-gl/dist/mapbox-gl.css';

import { ArrowLeft, ChevronRight, Eye, MapPin, Pause, Play, Target } from 'lucide-react';

import Map from 'react-map-gl';

// Import images
import { getPM25ColorInterpolation } from '../../utils/map/colors';
import { MAPBOX_TOKEN, TILESET_INFO } from '../../utils/map/constants.js';

import { DEFAULT_LIGHT_BASEMAP } from '../../constants/map/basemaps.js';
import { PM25_LEVELS } from '../../constants/pm25Levels';

import healthCategories from '../../assets/storymaps/images/health-categories.jpg';
import populationExposure from '../../assets/storymaps/images/population-exposure.jpg';
import wildfireSmokeIntro from '../../assets/storymaps/images/wildfire-smoke-intro.jpg';

// Import map utilities and constants

// Separate memoized components for each media type
const ImageComponent = React.memo(({ mediaSrc, mediaAlt, currentSection, sectionsLength }) => {
  return (
    <div className="relative w-full h-full overflow-hidden bg-obsidian/5">
      <img
        src={mediaSrc}
        alt={mediaAlt}
        className="w-full h-full object-cover"
        onError={e => {
          e.target.src = '/api/placeholder/800/600';
        }}
      />

      {/* Image overlay with section info */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-obsidian/20 shadow-lg">
          <div className="flex items-center gap-2 text-obsidian text-sm font-redhat">
            <div className="w-2 h-2 bg-mahogany rounded-full"></div>
            <span>{mediaAlt}</span>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="absolute top-6 left-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-obsidian/20 shadow-lg">
          <div className="flex items-center gap-2 text-obsidian text-sm font-redhat">
            <div className="w-2 h-2 bg-mahogany rounded-full animate-pulse"></div>
            <span>
              Section {currentSection + 1} of {sectionsLength}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

const VideoComponent = React.memo(({ mediaSrc, mediaAlt, currentSection, sectionsLength }) => {
  return (
    <div className="relative w-full h-full overflow-hidden bg-obsidian/5">
      <video
        src={mediaSrc}
        className="w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        onError={e => {
          console.warn('Video failed to load:', mediaSrc);
          e.target.style.display = 'none';
        }}
      />

      {/* Video overlay with controls */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-obsidian/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-obsidian text-sm font-redhat">
              <div className="w-2 h-2 bg-mahogany rounded-full animate-pulse"></div>
              <span>{mediaAlt}</span>
            </div>
            <div className="flex items-center gap-2 text-obsidian text-xs font-redhat">
              <Play className="w-3 h-3" />
              <span>Auto-playing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="absolute top-6 left-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-obsidian/20 shadow-lg">
          <div className="flex items-center gap-2 text-obsidian text-sm font-redhat">
            <div className="w-2 h-2 bg-mahogany rounded-full animate-pulse"></div>
            <span>
              Section {currentSection + 1} of {sectionsLength}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

const MapComponent = React.memo(
  ({
    viewport,
    mapRef,
    handleMapMove,
    handleMapLoad,
    currentSection,
    sectionsLength,
    timeStep,
    isPlaying,
    setIsPlaying,
    mapConfig
  }) => {
    return (
      <div className="relative w-full h-full overflow-hidden">
        <Map
          {...viewport}
          style={{ width: '100%', height: '100%' }}
          mapStyle={DEFAULT_LIGHT_BASEMAP}
          mapboxAccessToken={MAPBOX_TOKEN}
          onMove={handleMapMove}
          ref={mapRef}
          onLoad={handleMapLoad}
          projection="globe"
          interactive={false}
        />

        {/* Animation controls for map sections */}
        {(currentSection === 2 || currentSection === 5 || currentSection === 6) && (
          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-obsidian/20 shadow-lg">
              {(currentSection === 5 || currentSection === 6) && mapConfig?.baseDate ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="flex items-center gap-2 px-4 py-2 bg-mahogany text-white rounded-lg hover:bg-mahogany/80 transition-colors font-redhat"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <div className="text-sm text-obsidian font-redhat">
                      <div className="font-medium">
                        {mapConfig.baseDate} - Hour {timeStep}
                      </div>
                    </div>
                  </div>
                  {currentSection === 6 && (
                    <div className="text-right text-sm text-obsidian font-redhat">
                      <div className="font-medium">Population Analysis</div>
                      <div className="text-xs text-obsidian/70">
                        Drawn area shows exposure zones
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-obsidian font-redhat">
                  <div className="font-medium mb-2">4-Day Forecast Timeline</div>
                </div>
              )}

              {currentSection === 5 || currentSection === 6 ? (
                <div className="w-full bg-obsidian/20 rounded-full h-2">
                  <div
                    className="bg-mahogany h-2 rounded-full transition-all duration-200"
                    style={{
                      width: `${(timeStep / 11) * 100}%` // 12 hours (0-11), so divide by 11
                    }}
                  ></div>
                </div>
              ) : (
                currentSection === 2 && (
                  <div className="w-full bg-obsidian/20 rounded-full h-2">
                    <div
                      className="bg-mahogany h-2 rounded-full transition-all duration-200"
                      style={{
                        width: `${(timeStep / 96) * 100}%` // 96 hours for forecast section
                      }}
                    ></div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Health legend for specific map sections */}
        {mapConfig?.showHealthLegend && (
          <div className="absolute top-6 right-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-obsidian/20 shadow-lg">
              <h4 className="font-semibold mb-3 font-sora text-obsidian">PM2.5 Levels</h4>
              <div className="space-y-2 text-sm font-redhat text-obsidian">
                {PM25_LEVELS.slice(0, 6).map((level, index) => (
                  <div key={level.label} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border border-obsidian/20"
                      style={{ backgroundColor: level.color }}
                    ></div>
                    <span>
                      {level.label === 'Unhealthy for Sensitive Groups' ? 'USG' : level.label}(
                      {level.value}-{level.maxValue === Infinity ? '500+' : level.maxValue})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Progress indicator */}
        <div className="absolute top-6 left-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-obsidian/20 shadow-lg">
            <div className="flex items-center gap-2 text-obsidian text-sm font-redhat">
              <div className="w-2 h-2 bg-mahogany rounded-full animate-pulse"></div>
              <span>
                Section {currentSection + 1} of {sectionsLength}
              </span>
            </div>
          </div>
        </div>

        {/* PM2.5 Threshold indicator */}
        {mapConfig?.pm25Threshold && (
          <div className="absolute top-20 left-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-obsidian/20 shadow-lg">
              <div className="flex items-center gap-2 text-obsidian text-sm font-redhat">
                <div className="w-2 h-2 bg-blue rounded-full"></div>
                <span>PM2.5 ≥ {mapConfig.pm25Threshold} μg/m³</span>
              </div>
            </div>
          </div>
        )}

        {/* Population analysis drawn area overlay */}
        {mapConfig?.drawnArea && (
          <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full">
              {/* Example drawn area polygon - representing the analysis zone */}
              <polygon
                points="45%,35% 65%,30% 70%,45% 68%,60% 55%,65% 40%,55% 35%,40%"
                fill="rgba(220, 38, 127, 0.15)"
                stroke="#dc267f"
                strokeWidth="2"
                strokeDasharray="8,4"
                className="animate-pulse"
              />
              {/* Area label */}
              <text
                x="52%"
                y="48%"
                textAnchor="middle"
                className="fill-obsidian text-sm font-redhat font-medium"
                style={{ fontSize: '14px' }}
              >
                Analysis Area
              </text>
            </svg>
          </div>
        )}
      </div>
    );
  }
);

// Media Panel component that handles images, videos, and maps
const MediaPanel = React.memo(
  ({
    currentSection,
    sections,
    viewport,
    mapRef,
    handleMapMove,
    handleMapLoad,
    timeStep,
    isPlaying,
    setIsPlaying
  }) => {
    const currentSectionData = sections[currentSection];
    const { mediaType, mediaSrc, mediaAlt, mapConfig } = currentSectionData;

    // Simple switch without useMemo to prevent over-optimization
    switch (mediaType) {
      case 'image':
        return (
          <ImageComponent
            mediaSrc={mediaSrc}
            mediaAlt={mediaAlt}
            currentSection={currentSection}
            sectionsLength={sections.length}
          />
        );

      case 'video':
        return (
          <VideoComponent
            mediaSrc={mediaSrc}
            mediaAlt={mediaAlt}
            currentSection={currentSection}
            sectionsLength={sections.length}
          />
        );

      case 'map':
        return (
          <MapComponent
            viewport={viewport}
            mapRef={mapRef}
            handleMapMove={handleMapMove}
            handleMapLoad={handleMapLoad}
            currentSection={currentSection}
            sectionsLength={sections.length}
            timeStep={timeStep}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            mapConfig={mapConfig}
          />
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-obsidian/5">
            <div className="text-center text-obsidian/60 font-redhat">
              <div className="text-lg mb-2">Media not available</div>
              <div className="text-sm">Section {currentSection + 1}</div>
            </div>
          </div>
        );
    }
  }
);

// Story sections configuration with media types - moved outside component to prevent re-creation
const sections = [
  {
    id: 'intro',
    title: 'Wildfire Smoke: A Growing Threat',
    content:
      'Wildfires are becoming more frequent and intense, creating dangerous air quality conditions across the Western United States. Our tool provides critical 4-day smoke forecasts to help communities prepare and protect public health.',
    mediaType: 'image',
    mediaSrc: wildfireSmokeIntro,
    mediaAlt: 'Wildfire smoke billowing over mountainous terrain',
    stats: { fires: '2,847', affected: '12.3M', area: '8.9M acres' }
  },
  {
    id: 'pm25',
    title: 'Understanding PM2.5 Health Impacts',
    content:
      'Fine particulate matter (PM2.5) from wildfire smoke penetrates deep into lungs and can enter the bloodstream. Even short-term exposure can cause serious health problems, especially for sensitive groups.',
    mediaType: 'video',
    mediaSrc: 'src/assets/storymaps/videos/pm25-health-impacts.mp4',
    mediaAlt: 'Animation showing PM2.5 particles entering respiratory system',
    stats: { particles: '2.5μm', penetration: '100%', risk: 'High' }
  },
  {
    id: 'forecast',
    title: '4-Day Smoke Forecasting',
    content:
      'Our advanced CMAQ chemical transport model provides accurate smoke forecasts up to 4 days ahead, helping communities plan evacuations, outdoor activities, and health precautions.',
    mediaType: 'map',
    mapConfig: {
      zoom: 5,
      center: [-118, 42],
      showSmoke: true,
      intensity: 'variable',
      showAnimation: true,
      pm25Threshold: 12
    },
    stats: { accuracy: '89%', resolution: '12km', updates: '4x daily' }
  },
  {
    id: 'population',
    title: 'Population Exposure Analysis',
    content:
      'Identify how many people are exposed to dangerous air quality levels. Our tool overlays population density with smoke forecasts to prioritize public health responses.',
    mediaType: 'image',
    mediaSrc: populationExposure,
    mediaAlt: 'Population density overlay with smoke forecast visualization',
    stats: { exposed: '2.1M', children: '340K', elderly: '180K' }
  },
  {
    id: 'health-categories',
    title: 'Color-Coded Health Impact Levels',
    content:
      'Six distinct health categories from Good to Hazardous help users quickly understand air quality risks. Each level provides specific guidance for outdoor activities and health precautions.',
    mediaType: 'image',
    mediaSrc: healthCategories,
    mediaAlt: 'Color-coded air quality health categories visualization',
    stats: { categories: '6', guidance: 'Real-time', coverage: '100%' }
  },
  {
    id: 'tools',
    title: 'New Mexico Wildfire: Real-Time Smoke Spread',
    content:
      'Watch how smoke from intense wildfires in the New Mexico region spreads across the southwestern United States over a 12-hour period. Recent fires near Fort Stanton have forced evacuations and damaged historic sites, with crews battling flames that have scorched over 3 square kilometers. This animation shows actual PM2.5 concentrations as fire conditions intensify and wind patterns carry dangerous smoke plumes hundreds of miles from the source. Source: [Guardian News](https://www.theguardian.com/world/2025/may/27/new-mexico-wildfire)',
    mediaType: 'map',
    mapConfig: {
      zoom: 5,
      center: [-110, 32],
      showSmoke: true,
      intensity: 'overview',
      pm25Threshold: 5,
      customTileset: 'pkulandh.pm25_202505260',
      customLayer: 'pm25_202505260',
      showAnimation: true,
      baseDate: '2025-05-26',
      showHealthLegend: true
    },
    stats: { duration: '12hrs', region: 'SW US', peak: '250+ μg/m³' }
  },
  {
    id: 'population-exposure',
    title: 'Population Impact Assessment',
    content:
      'Analyze the human impact of the New Mexico wildfire by examining population exposure within the affected smoke plume area. This interactive analysis shows how many people are breathing hazardous air quality levels, with detailed breakdowns by health risk categories and vulnerable populations including children and elderly residents.',
    mediaType: 'map',
    mapConfig: {
      zoom: 6,
      center: [-105.5, 33.5],
      showSmoke: true,
      intensity: 'detailed',
      pm25Threshold: 5,
      customTileset: 'pkulandh.pm25_202505260',
      customLayer: 'pm25_202505260',
      showAnimation: true,
      baseDate: '2025-05-26',
      showHealthLegend: true,
      showPopulationAnalysis: true,
      drawnArea: true
    },
    stats: { exposed: '45K+', children: '8.2K', elderly: '4.1K' }
  },
  {
    id: 'action',
    title: 'Start Protecting Your Community',
    content:
      'Ready to explore the full wildfire smoke forecast tool? Access real-time data, create custom analyses, and get the information you need to keep your community safe.',
    mediaType: 'video',
    mediaSrc: 'src/assets/storymaps/videos/interactive-tools-demo.mp4',
    mediaAlt: 'Demonstration of interactive analysis tools',
    stats: { users: '10K+', agencies: '150+', uptime: '99.9%' }
  }
];

const StoryMapsDemo = ({ onLaunchTool, onBack }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeStep, setTimeStep] = useState(0);
  const [mapInstance, setMapInstance] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [layersInitialized, setLayersInitialized] = useState(false);
  const [lastUpdateKey, setLastUpdateKey] = useState('');
  const scrollContainerRef = useRef(null);
  const sectionRefs = useRef([]);
  const mapRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Map viewport state
  const [viewport, setViewport] = useState({
    latitude: 32,
    longitude: -110,
    zoom: 5,
    bearing: 0,
    pitch: 0
  });

  // Calculate current hour based on timeStep for real data
  const getCurrentHour = () => {
    return timeStep % 96; // 4 days * 24 hours
  };

  // Get current date/time for real map data - stabilized version
  const getCurrentDateTime = () => {
    const currentHour = getCurrentHour();

    // Use a fixed base date to prevent constant recalculation
    const baseDate = new Date('2024-01-01'); // Fixed reference date
    baseDate.setHours(baseDate.getHours() + currentHour);

    return {
      date: baseDate.toISOString().split('T')[0],
      hour: baseDate.getHours(),
      fullDateTime: baseDate
    };
  };

  // Initialize map layers with real PM2.5 data
  const initializeMapLayers = map => {
    if (!map || !map.isStyleLoaded() || layersInitialized) return;

    try {
      // Add PM2.5 data sources and layers - but handle errors gracefully
      TILESET_INFO.forEach(tileset => {
        const sourceId = `demo-source-${tileset.id}`;
        const layerId = `demo-layer-${tileset.id}`;

        // Add source with error handling
        if (!map.getSource(sourceId)) {
          try {
            map.addSource(sourceId, {
              type: 'vector',
              url: `mapbox://${tileset.id}`,
              maxzoom: 9
            });
          } catch (error) {
            console.warn(`Failed to add source ${sourceId}:`, error);
            return; // Skip this tileset if source fails
          }
        }

        // Add layer with error handling
        if (!map.getLayer(layerId)) {
          try {
            map.addLayer({
              id: layerId,
              type: 'circle',
              source: sourceId,
              'source-layer': tileset.layer,
              maxzoom: 9,
              paint: {
                'circle-radius': [
                  'interpolate',
                  ['exponential', 2],
                  ['zoom'],
                  4,
                  2,
                  5,
                  5,
                  6,
                  10,
                  7,
                  25,
                  8,
                  40,
                  9,
                  60
                ],
                'circle-color': getPM25ColorInterpolation(false), // Light theme
                'circle-blur': 0.6,
                'circle-opacity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  4,
                  0.75,
                  6,
                  0.75,
                  7,
                  0.3,
                  8,
                  0.2,
                  9,
                  0.2
                ]
              },
              layout: {
                visibility: 'none'
              }
            });
          } catch (error) {
            console.warn(`Failed to add layer ${layerId}:`, error);
          }
        }
      });

      // Add custom tileset for section 7
      const customTilesetId = 'pkulandh.pm25_202505260';
      const customSourceId = `demo-source-${customTilesetId}`;
      const customLayerId = `demo-layer-${customTilesetId}`;

      if (!map.getSource(customSourceId)) {
        try {
          map.addSource(customSourceId, {
            type: 'vector',
            url: `mapbox://${customTilesetId}`,
            maxzoom: 9
          });

          // Only add layer if source was successful
          if (!map.getLayer(customLayerId)) {
            map.addLayer({
              id: customLayerId,
              type: 'circle',
              source: customSourceId,
              'source-layer': 'pm25_202505260',
              maxzoom: 9,
              paint: {
                'circle-radius': [
                  'interpolate',
                  ['exponential', 2],
                  ['zoom'],
                  4,
                  2,
                  5,
                  5,
                  6,
                  10,
                  7,
                  25,
                  8,
                  40,
                  9,
                  60
                ],
                'circle-color': getPM25ColorInterpolation(false), // Light theme
                'circle-blur': 0.6,
                'circle-opacity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  4,
                  0.75,
                  6,
                  0.75,
                  7,
                  0.3,
                  8,
                  0.2,
                  9,
                  0.2
                ]
              },
              layout: {
                visibility: 'none'
              }
            });
            console.log(`Successfully added custom tileset: ${customTilesetId}`);
          }
        } catch (error) {
          console.warn(`Failed to add custom tileset ${customTilesetId}:`, error);
        }
      }

      // Add census tracts layer for population analysis
      const censusSourceId = 'census-tracts-source';
      const censusLayerId = 'census-tracts-layer';
      const highlightedCensusLayerId = 'highlighted-census-tracts-layer';

      if (!map.getSource(censusSourceId)) {
        try {
          map.addSource(censusSourceId, {
            type: 'vector',
            url: 'mapbox://mapbox.82pkq93d', // Mapbox census tracts tileset
            maxzoom: 12
          });

          // Add base census tracts layer (subtle)
          if (!map.getLayer(censusLayerId)) {
            map.addLayer({
              id: censusLayerId,
              type: 'fill',
              source: censusSourceId,
              'source-layer': 'original',
              paint: {
                'fill-color': 'rgba(200, 200, 200, 0.1)',
                'fill-outline-color': 'rgba(150, 150, 150, 0.3)'
              },
              layout: {
                visibility: 'none'
              }
            });
          }

          // Add highlighted census tracts layer for El Paso area
          if (!map.getLayer(highlightedCensusLayerId)) {
            map.addLayer({
              id: highlightedCensusLayerId,
              type: 'fill',
              source: censusSourceId,
              'source-layer': 'original',
              paint: {
                'fill-color': 'rgba(220, 38, 127, 0.3)', // Magenta highlight
                'fill-outline-color': '#dc267f'
              },
              filter: [
                'in',
                'GEOID',
                '48141950100', // El Paso County census tract
                '48141950200', // El Paso County census tract
                '48141950300', // El Paso County census tract
                '48141950400', // El Paso County census tract
                '48141950500' // El Paso County census tract
              ],
              layout: {
                visibility: 'none'
              }
            });
          }

          console.log('Successfully added census tracts layers');
        } catch (error) {
          console.warn('Failed to add census tracts layers:', error);
        }
      }

      setLayersInitialized(true);
      console.log('Demo map layers initialized successfully');
    } catch (error) {
      console.error('Error initializing demo map layers:', error);
    }
  };

  // Update map layers based on current section and time
  const updateMapLayers = map => {
    if (!map || !map.isStyleLoaded() || !layersInitialized) return;

    try {
      const config = sections[currentSection]?.mapConfig || {};
      const pm25Threshold = config.pm25Threshold || 12;

      // Check if this is section 6 or 7 with custom tileset
      const isCustomTilesetSection =
        (currentSection === 5 || currentSection === 6) && config.customTileset; // Sections 6 and 7 are indices 5 and 6

      let currentTileset;
      let currentLayerId;

      if (isCustomTilesetSection) {
        // Use custom tileset for section 7
        currentTileset = {
          id: config.customTileset,
          layer: config.customLayer
        };
        currentLayerId = `demo-layer-${config.customTileset}`;

        // Check if the custom layer actually exists
        if (!map.getLayer(currentLayerId)) {
          console.warn(`Custom layer ${currentLayerId} not found, skipping layer update`);
          return;
        }
      } else {
        // Use timeStep directly instead of calculating from date
        const hour = timeStep % 24;
        const dayOffset = Math.floor(timeStep / 24);

        // Create a stable date string based on timeStep
        const baseDate = new Date('2024-01-01');
        baseDate.setDate(baseDate.getDate() + dayOffset);
        const dateString = baseDate.toISOString().split('T')[0];
        const timeString = `${dateString}T${String(hour).padStart(2, '0')}:00:00`;

        // Find the appropriate tileset - use a more flexible approach
        currentTileset = TILESET_INFO.find(tileset => {
          // For demo purposes, use the first available tileset
          return tileset;
        });

        if (!currentTileset) {
          console.warn('No tileset found for demo');
          return;
        }

        currentLayerId = `demo-layer-${currentTileset.id}`;

        // Check if the layer actually exists
        if (!map.getLayer(currentLayerId)) {
          console.warn(`Layer ${currentLayerId} not found, trying to find any available layer`);

          // Try to find any working layer from TILESET_INFO
          let foundLayer = null;
          for (const tileset of TILESET_INFO) {
            const testLayerId = `demo-layer-${tileset.id}`;
            if (map.getLayer(testLayerId)) {
              foundLayer = testLayerId;
              currentLayerId = testLayerId;
              break;
            }
          }

          if (!foundLayer) {
            console.warn('No working layers found, skipping layer update');
            return;
          }
        }
      }

      // Hide all layers first (including custom tileset) - but only if they exist
      TILESET_INFO.forEach(tileset => {
        const layerId = `demo-layer-${tileset.id}`;
        try {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', 'none');
            map.setPaintProperty(layerId, 'circle-opacity', 0);
          }
        } catch (error) {
          console.warn(`Error hiding layer ${layerId}:`, error);
        }
      });

      // Also hide custom tileset layer if it exists
      const customLayerId = 'demo-layer-pkulandh.pm25_202505260';
      try {
        if (map.getLayer(customLayerId)) {
          map.setLayoutProperty(customLayerId, 'visibility', 'none');
          map.setPaintProperty(customLayerId, 'circle-opacity', 0);
        }
      } catch (error) {
        console.warn(`Error hiding custom layer ${customLayerId}:`, error);
      }

      // Hide census tracts layers
      const censusLayerId = 'census-tracts-layer';
      const highlightedCensusLayerId = 'highlighted-census-tracts-layer';
      try {
        if (map.getLayer(censusLayerId)) {
          map.setLayoutProperty(censusLayerId, 'visibility', 'none');
        }
        if (map.getLayer(highlightedCensusLayerId)) {
          map.setLayoutProperty(highlightedCensusLayerId, 'visibility', 'none');
        }
      } catch (error) {
        console.warn('Error hiding census tracts layers:', error);
      }

      // Show and update current layer
      try {
        if (map.getLayer(currentLayerId)) {
          let layerFilter;

          if (isCustomTilesetSection) {
            // For custom tileset, use time-based filtering
            const config = sections[currentSection].mapConfig;
            const baseDate = config.baseDate || '2025-05-26';
            const currentHour = timeStep % 24;
            const currentTimeString = `${baseDate}T${String(currentHour).padStart(2, '0')}:00:00`;

            // Create filter for both PM2.5 threshold and time
            layerFilter = [
              'all',
              ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold],
              ['==', ['get', 'time'], currentTimeString]
            ];

            console.log(
              `Filtering custom tileset for time: ${currentTimeString}, threshold: ${pm25Threshold}`
            );
          } else {
            // For regular tilesets, use simple PM2.5 filter
            layerFilter = ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold];
          }

          map.setFilter(currentLayerId, layerFilter);
          map.setLayoutProperty(currentLayerId, 'visibility', 'visible');

          console.log(
            `Successfully showing layer: ${currentLayerId} for section ${currentSection + 1}`
          );
        } else {
          console.warn(`Layer ${currentLayerId} not found when trying to show it`);
        }
      } catch (error) {
        console.warn(`Error updating layer ${currentLayerId}:`, error);
      }

      // Show census tracts layers for section 7 (population analysis)
      if (currentSection === 6) {
        // Section 7 is index 6
        try {
          const censusLayerId = 'census-tracts-layer';
          const highlightedCensusLayerId = 'highlighted-census-tracts-layer';

          if (map.getLayer(censusLayerId)) {
            map.setLayoutProperty(censusLayerId, 'visibility', 'visible');
          }
          if (map.getLayer(highlightedCensusLayerId)) {
            map.setLayoutProperty(highlightedCensusLayerId, 'visibility', 'visible');
          }

          console.log('Census tracts layers shown for population analysis section');
        } catch (error) {
          console.warn('Error showing census tracts layers:', error);
        }
      }
    } catch (error) {
      console.error('Error in updateMapLayers:', error);
    }
  };

  // Handle scroll events to detect current section
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;

      // Find which section is most visible
      let newCurrentSection = 0;
      let maxVisibility = 0;

      sectionRefs.current.forEach((ref, index) => {
        if (!ref) return;

        const rect = ref.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const visibleTop = Math.max(rect.top - containerRect.top, 0);
        const visibleBottom = Math.min(rect.bottom - containerRect.top, containerHeight);
        const visibleHeight = Math.max(visibleBottom - visibleTop, 0);
        const visibility = visibleHeight / rect.height;

        if (visibility > maxVisibility) {
          maxVisibility = visibility;
          newCurrentSection = index;
        }
      });

      if (newCurrentSection !== currentSection) {
        setCurrentSection(newCurrentSection);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [currentSection]);

  // Update map when section changes
  useEffect(() => {
    const currentSectionData = sections[currentSection];

    // Only update map if current section is a map type
    if (currentSectionData?.mediaType !== 'map') return;

    if (mapInstance && isMapLoaded && layersInitialized && mapInstance.isStyleLoaded()) {
      const config = currentSectionData.mapConfig || {};
      const updateKey = `${currentSection}-${timeStep}-${config.pm25Threshold}`;

      // Only update if something actually changed
      if (updateKey === lastUpdateKey) return;

      try {
        // Update map viewport if specified
        if (config.center && config.zoom) {
          setViewport(prev => ({
            ...prev,
            latitude: config.center[1],
            longitude: config.center[0],
            zoom: config.zoom
          }));
        }

        // Update layers with a small delay to ensure viewport change completes
        setTimeout(() => {
          updateMapLayers(mapInstance);
          setLastUpdateKey(updateKey);
        }, 50);
      } catch (error) {
        console.error('Error updating map for section change:', error);
      }
    }
  }, [currentSection, timeStep, mapInstance, isMapLoaded, layersInitialized, lastUpdateKey]);

  // Auto-play animation for forecast sections (only map sections)
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    let interval;
    const currentSectionData = sections[currentSection];

    console.log('Animation effect triggered:', {
      isPlaying,
      currentSection,
      mediaType: currentSectionData?.mediaType
    });

    if (isPlaying && currentSectionData?.mediaType === 'map') {
      if (currentSection === 2) {
        // Regular forecast section - 4 days cycle
        console.log('Starting regular forecast animation');
        interval = setInterval(() => {
          if (!isPlayingRef.current) {
            console.log('Animation stopped by ref');
            return;
          }
          setTimeStep(prev => {
            console.log('Regular forecast step:', prev);
            return (prev + 1) % 96;
          });
        }, 1000);
      } else if (currentSection === 5 || currentSection === 6) {
        // Custom tileset sections (6 and 7) - only 12 hours, loop back to start
        console.log('Starting custom tileset animation for section', currentSection + 1);
        interval = setInterval(() => {
          if (!isPlayingRef.current) {
            console.log('Custom animation stopped by ref');
            return;
          }
          setTimeStep(prev => {
            const nextStep = (prev + 1) % 12; // Loop back to 0 after 11
            console.log('Custom animation step:', prev, '->', nextStep);
            return nextStep;
          });
        }, 1000);
      }
    }

    return () => {
      if (interval) {
        console.log('Clearing interval');
        clearInterval(interval);
      }
    };
  }, [isPlaying, currentSection]);

  // Handle map load
  const handleMapLoad = useCallback(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      setMapInstance(map);
      setIsMapLoaded(true);

      // Wait for style to be fully loaded before initializing layers
      const initializeLayers = () => {
        if (map.isStyleLoaded()) {
          // Add a small delay to ensure everything is ready
          setTimeout(() => {
            initializeMapLayers(map);
          }, 100);
        } else {
          map.once('style.load', () => {
            setTimeout(() => {
              initializeMapLayers(map);
            }, 100);
          });
        }
      };

      initializeLayers();
    }
  }, []);

  // Handle viewport changes
  const handleMapMove = useCallback(evt => {
    setViewport(evt.viewState);
  }, []);

  return (
    <div className="fixed inset-0 bg-white text-obsidian overflow-hidden font-sora">
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white backdrop-blur-sm text-obsidian border border-obsidian/20 rounded-lg transition-all transform hover:scale-105 font-redhat shadow-lg"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Intro</span>
      </button>

      <div className="flex h-full">
        {/* Left Panel - Scrollable Content */}
        <div className="w-1/2 h-full overflow-y-auto bg-white" ref={scrollContainerRef}>
          <div className="min-h-full">
            {sections.map((section, index) => (
              <div
                key={section.id}
                ref={el => (sectionRefs.current[index] = el)}
                className="min-h-screen flex flex-col justify-center p-12 relative"
              >
                <div className="max-w-lg">
                  {/* Section number */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-mahogany flex items-center justify-center font-bold text-lg font-sora text-white">
                      {index + 1}
                    </div>
                    <div className="h-px bg-gradient-to-r from-mahogany to-transparent flex-1"></div>
                  </div>

                  {/* Title */}
                  <h2 className="text-section-header font-bold mb-6 leading-tight font-sora text-obsidian">
                    {section.title}
                  </h2>

                  {/* Content */}
                  <p className="text-sub-header text-obsidian/80 mb-8 leading-relaxed font-redhat">
                    {section.content}
                  </p>

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {Object.entries(section.stats).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-2xl font-bold text-mahogany mb-1 font-sora">
                          {value}
                        </div>
                        <div className="text-sm text-obsidian/60 capitalize font-redhat">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons for last section */}
                  {index === sections.length - 1 && (
                    <div className="flex flex-col gap-4">
                      <button
                        onClick={onLaunchTool}
                        className="flex items-center justify-center gap-3 bg-mahogany hover:bg-mahogany/80 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg font-sora"
                      >
                        <MapPin className="w-5 h-5" />
                        Launch Full Tool
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      <div className="grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 bg-green hover:bg-green/80 text-white py-3 px-4 rounded-lg transition-colors font-redhat">
                          <Eye className="w-4 h-4" />
                          View Demo
                        </button>
                        <button className="flex items-center justify-center gap-2 bg-green hover:bg-green/80 text-white py-3 px-4 rounded-lg transition-colors font-redhat">
                          <Target className="w-4 h-4" />
                          Learn More
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section indicator dots */}
                <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                  <div className="flex flex-col gap-2">
                    {sections.map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === currentSection
                            ? 'bg-mahogany scale-150'
                            : i < currentSection
                              ? 'bg-tan/60'
                              : 'bg-obsidian/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Fixed Media */}
        <div className="w-1/2 h-full relative">
          <MediaPanel
            currentSection={currentSection}
            sections={sections}
            viewport={viewport}
            mapRef={mapRef}
            handleMapMove={handleMapMove}
            handleMapLoad={handleMapLoad}
            timeStep={timeStep}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
          />
        </div>
      </div>

      {/* Progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-obsidian/20">
        <div
          className="h-full bg-gradient-to-r from-mahogany to-tan transition-all duration-300"
          style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default StoryMapsDemo;
