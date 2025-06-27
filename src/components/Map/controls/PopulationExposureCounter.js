import React, { useCallback, useEffect, useRef, useState } from 'react';

import _ from 'lodash';

import { Users2 } from 'lucide-react';

import getSelectedCensusTracts from '../../../utils/map/censusAnalysis';
import { TILESET_INFO } from '../../../utils/map/constants';

import { PM25_LEVELS } from '../../../constants/pm25Levels';

// Helper for point-in-polygon check
const isPointInPolygon = (point, polygon) => {
  if (!Array.isArray(point) || point.length < 2) return false;

  const x = point[0],
    y = point[1];
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};

// Find active layer for current time
const findActiveLayer = (map, date, hour) => {
  if (!map || !map.getStyle()) return null;

  // Find matching tileset for current date and hour
  const tileset = TILESET_INFO.find(
    t => t.date === date && hour >= t.startHour && hour <= t.endHour
  );

  if (!tileset) {
    console.warn('No tileset found for:', { date, hour });
    return null;
  }

  const layerId = `layer-${tileset.id}`;
  return map.getLayer(layerId) ? layerId : null;
};

const PopulationExposureCounter = ({ map, polygon, isDarkMode, currentDateTime, isPlaying }) => {
  const [stats, setStats] = useState({
    censusStats: {
      value: null,
      isLoading: true,
      error: null,
      tractCount: 0,
      status: 'idle'
    },
    exposureByPM25: {
      value: null,
      isLoading: true,
      error: null,
      // Add distribution to store percentage within PM2.5 categories separately
      distribution: null
    }
  });

  // Keep track of census data separately
  const censusDataRef = useRef(null);
  // Keep track of the last successful PM2.5 data to avoid loss on further updates
  const lastValidPM25DataRef = useRef(null);
  // Track the current polygon to know when it changes
  const currentPolygonRef = useRef(null);

  // Reset the cache when polygon changes
  useEffect(() => {
    if (polygon) {
      // Convert polygon to string for comparison
      const polygonStr = JSON.stringify(polygon);
      if (currentPolygonRef.current !== polygonStr) {
        // Reset when polygon changes
        lastValidPM25DataRef.current = null;
        currentPolygonRef.current = polygonStr;
      }
    } else {
      // Clear when no polygon
      lastValidPM25DataRef.current = null;
      currentPolygonRef.current = null;
    }
  }, [polygon]);

  // Update census data when polygon changes
  const updateCensusData = useCallback(async () => {
    if (!map || !polygon) return;

    try {
      setStats(prev => ({
        ...prev,
        censusStats: {
          ...prev.censusStats,
          isLoading: true,
          error: null,
          status: 'loading'
        }
      }));

      const initialResult = await getSelectedCensusTracts(map, polygon, isDarkMode);
      censusDataRef.current = initialResult;

      // First update with tract count
      setStats(prev => ({
        ...prev,
        censusStats: {
          value: {
            totalPopulation: null,
            tractCount: initialResult.summary.tractCount
          },
          isLoading: true,
          error: null,
          tractCount: initialResult.summary.tractCount,
          status: 'calculating'
        }
      }));

      // Wait for population data
      if (initialResult.populationPromise) {
        const populationResult = await initialResult.populationPromise;

        setStats(prev => ({
          ...prev,
          censusStats: {
            value: {
              totalPopulation: populationResult.summary.totalPopulation,
              tractCount: populationResult.summary.tractCount
            },
            isLoading: false,
            error: null,
            tractCount: populationResult.summary.tractCount,
            status: 'complete'
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching census data:', error);
      setStats(prev => ({
        ...prev,
        censusStats: {
          value: null,
          isLoading: false,
          error: 'Failed to fetch census data',
          tractCount: 0,
          status: 'error'
        }
      }));
    }
  }, [map, polygon, isDarkMode]);

  // Calculate exposure for current time
  const calculateExposure = useCallback(async () => {
    if (!map || !polygon || !currentDateTime) {
      return;
    }

    try {
      // Don't set loading state if we have cached data
      if (!lastValidPM25DataRef.current) {
        setStats(prev => ({
          ...prev,
          exposureByPM25: {
            ...prev.exposureByPM25,
            isLoading: true,
            error: null
          }
        }));
      }

      const timeString = `${currentDateTime.date}T${String(currentDateTime.hour).padStart(2, '0')}:00:00`;

      // Find active layer
      const activeLayer = findActiveLayer(map, currentDateTime.date, currentDateTime.hour);

      if (!activeLayer) {
        console.warn('No active layer found for the current time period');

        // Use cached data if available instead of showing error
        if (lastValidPM25DataRef.current) {
          console.log('Using cached PM2.5 data for this time period');
          setStats(prev => ({
            ...prev,
            exposureByPM25: {
              value: lastValidPM25DataRef.current.value,
              distribution: lastValidPM25DataRef.current.distribution,
              isLoading: false,
              error: null
            }
          }));
          return;
        }

        setStats(prev => ({
          ...prev,
          exposureByPM25: {
            value: null,
            distribution: null,
            isLoading: false,
            error: 'No data available for this time period'
          }
        }));
        return;
      }

      // Calculate bounds with padding
      const bounds = {
        minLng: Math.min(...polygon.map(p => p[0])),
        maxLng: Math.max(...polygon.map(p => p[0])),
        minLat: Math.min(...polygon.map(p => p[1])),
        maxLat: Math.max(...polygon.map(p => p[1]))
      };

      let features = [];

      // Method 1: Try queryRenderedFeatures with bounds first
      try {
        const lngPad = (bounds.maxLng - bounds.minLng) * 0.2;
        const latPad = (bounds.maxLat - bounds.minLat) * 0.2;
        const paddedBounds = [
          [bounds.minLng - lngPad, bounds.minLat - latPad],
          [bounds.maxLng + lngPad, bounds.maxLat + latPad]
        ];

        const sw = map.project(paddedBounds[0]);
        const ne = map.project(paddedBounds[1]);

        features = map
          .queryRenderedFeatures([sw, ne], {
            layers: [activeLayer],
            filter: ['==', ['get', 'time'], timeString]
          })
          .filter(feature => {
            if (!feature.geometry || !feature.geometry.coordinates) return false;
            return isPointInPolygon(feature.geometry.coordinates, polygon);
          });

        console.log(
          `Method 1: Found ${features.length} PM2.5 data points within the selected area`
        );
      } catch (err) {
        console.warn('Error using queryRenderedFeatures with bounds:', err);
      }

      // Method 2: If first method doesn't work, try querySourceFeatures
      if (features.length === 0) {
        try {
          const sourceId = activeLayer.replace('layer-', 'source-');
          if (map.getSource(sourceId)) {
            // This queries the source directly, which might get us more features
            const sourceFeatures = map.querySourceFeatures(sourceId, {
              sourceLayer: activeLayer.replace('layer-', ''),
              filter: ['==', ['get', 'time'], timeString]
            });

            // Filter by polygon
            features = sourceFeatures.filter(feature => {
              if (!feature.geometry || !feature.geometry.coordinates) return false;
              return isPointInPolygon(feature.geometry.coordinates, polygon);
            });

            console.log(`Method 2: Found ${features.length} PM2.5 data points from source`);
          }
        } catch (err) {
          console.warn('Error using querySourceFeatures:', err);
        }
      }

      // Method 3: If still no features, try to get all visible features and filter manually
      if (features.length === 0) {
        try {
          // Get all visible features from the layer
          const visibleFeatures = map.queryRenderedFeatures({
            layers: [activeLayer]
          });

          console.log(`Method 3: Found ${visibleFeatures.length} total visible features`);

          // Filter by time and polygon
          features = visibleFeatures.filter(feature => {
            if (!feature.geometry || !feature.geometry.coordinates) return false;
            if (feature.properties.time !== timeString) return false;
            return isPointInPolygon(feature.geometry.coordinates, polygon);
          });

          console.log(`Method 3: After filtering, ${features.length} features are in the polygon`);
        } catch (err) {
          console.warn('Error using alternative feature query:', err);
        }
      }

      // Method 4: Scan the visible area with a grid of points
      if (features.length === 0) {
        try {
          const gridSize = 20; // 20x20 grid
          const lngStep = (bounds.maxLng - bounds.minLng) / gridSize;
          const latStep = (bounds.maxLat - bounds.minLat) / gridSize;

          const gridPoints = [];
          for (let i = 0; i <= gridSize; i++) {
            for (let j = 0; j <= gridSize; j++) {
              const lng = bounds.minLng + i * lngStep;
              const lat = bounds.minLat + j * latStep;
              gridPoints.push([lng, lat]);
            }
          }

          console.log(`Method 4: Created ${gridPoints.length} grid points to sample`);

          // Query each point
          let gridFeatures = [];
          gridPoints.forEach(point => {
            if (isPointInPolygon(point, polygon)) {
              const pointFeatures = map.queryRenderedFeatures(map.project(point), {
                layers: [activeLayer]
              });

              // Filter for correct time
              const validFeatures = pointFeatures.filter(f => f.properties.time === timeString);

              gridFeatures = [...gridFeatures, ...validFeatures];
            }
          });

          // De-duplicate features
          const uniqueIds = new Set();
          features = gridFeatures.filter(feature => {
            // Create a unique ID using coordinates and properties
            const id = `${feature.geometry.coordinates[0]}_${feature.geometry.coordinates[1]}_${feature.properties.PM25}`;
            if (uniqueIds.has(id)) return false;
            uniqueIds.add(id);
            return true;
          });

          console.log(`Method 4: Found ${features.length} features using grid sampling`);
        } catch (err) {
          console.warn('Error using grid sampling method:', err);
        }
      }

      console.log(`Final result: Found ${features.length} PM2.5 data points to process`);

      // If no features found but we have cached data, use that instead
      if (features.length === 0 && lastValidPM25DataRef.current) {
        console.log('No new data found, using cached PM2.5 data');
        setStats(prev => ({
          ...prev,
          exposureByPM25: {
            value: lastValidPM25DataRef.current.value,
            distribution: lastValidPM25DataRef.current.distribution,
            isLoading: false,
            error: null
          }
        }));
        return;
      }

      // Initialize exposure categories using our local PM25_LEVELS
      const exposureByPM25 = {};
      const distributionByPM25 = {};
      PM25_LEVELS.forEach(level => {
        exposureByPM25[level.label] = 0;
        distributionByPM25[level.label] = 0;
      });

      let calculatedAvgPM25 = 0;
      let hasData = false;

      if (features.length > 0) {
        // Create grid of PM2.5 values
        const pm25Grid = features.reduce((grid, feature) => {
          const pm25 = parseFloat(feature.properties.PM25);
          if (!isNaN(pm25)) {
            const coords = feature.geometry.coordinates;
            grid.push({
              pm25,
              coordinates: coords
            });
          }
          return grid;
        }, []);

        console.log(`Created PM2.5 grid with ${pm25Grid.length} valid points`);

        // Calculate average PM2.5 and distribute population
        if (pm25Grid.length > 0) {
          calculatedAvgPM25 =
            pm25Grid.reduce((sum, point) => sum + point.pm25, 0) / pm25Grid.length;
          console.log(`Average PM2.5 for the area: ${calculatedAvgPM25.toFixed(1)}`);

          // First, count points in each category for distribution calculation
          const pointsPerCategory = {};
          PM25_LEVELS.forEach(level => {
            pointsPerCategory[level.label] = 0;
          });

          // Count points in each category
          pm25Grid.forEach(gridPoint => {
            const category = PM25_LEVELS.find((level, index) => {
              const nextLevel = PM25_LEVELS[index + 1];
              return (
                gridPoint.pm25 >= level.value && (!nextLevel || gridPoint.pm25 < nextLevel.value)
              );
            });

            if (category) {
              pointsPerCategory[category.label]++;
              hasData = true;
            }
          });

          // Calculate distribution percentages based on point count
          const totalPoints = pm25Grid.length;
          PM25_LEVELS.forEach(level => {
            const count = pointsPerCategory[level.label] || 0;
            distributionByPM25[level.label] =
              totalPoints > 0 ? parseFloat(((count / totalPoints) * 100).toFixed(1)) : 0;
          });

          // Get census data for population distribution
          const totalPopulation = censusDataRef.current?.summary?.totalPopulation;

          if (totalPopulation) {
            console.log(`Total population: ${totalPopulation.toLocaleString()}`);

            // Distribute population based on point distribution
            PM25_LEVELS.forEach(level => {
              const pointCount = pointsPerCategory[level.label] || 0;
              const proportion = totalPoints > 0 ? pointCount / totalPoints : 0;
              exposureByPM25[level.label] = Math.round(proportion * totalPopulation);
            });
          } else {
            console.log('No population data available, using point counts');
            // Just use the point counts
            PM25_LEVELS.forEach(level => {
              exposureByPM25[level.label] = pointsPerCategory[level.label] || 0;
            });
          }
        }
      }

      // If we still have no data after all attempts, but have cached data
      if (!hasData && lastValidPM25DataRef.current) {
        console.warn('Could not find new PM2.5 data, using cached data');
        setStats(prev => ({
          ...prev,
          exposureByPM25: {
            value: lastValidPM25DataRef.current.value,
            distribution: lastValidPM25DataRef.current.distribution,
            isLoading: false,
            error: null
          }
        }));
        return;
      }

      // If we have no data and no cache, show error
      if (!hasData && !lastValidPM25DataRef.current) {
        console.warn('Could not find any PM2.5 data for this area and time period');
        setStats(prev => ({
          ...prev,
          exposureByPM25: {
            value: null,
            distribution: null,
            isLoading: false,
            error: 'No PM2.5 data available for this area'
          }
        }));
        return;
      }

      // Cache the valid data for future use
      if (hasData) {
        lastValidPM25DataRef.current = {
          value: exposureByPM25,
          distribution: distributionByPM25,
          avgPM25: calculatedAvgPM25,
          timestamp: Date.now()
        };
      }

      // Update state with calculated values
      setStats(prev => ({
        ...prev,
        censusStats: {
          ...prev.censusStats,
          value: { ...prev.censusStats.value, avgPM25: calculatedAvgPM25 }
        },
        exposureByPM25: {
          value: exposureByPM25,
          distribution: distributionByPM25,
          isLoading: false,
          error: null
        }
      }));

      console.log('PM2.5 Exposure calculated:', exposureByPM25);
      console.log('PM2.5 Distribution calculated:', distributionByPM25);
    } catch (error) {
      console.error('Error calculating exposure:', error);

      // Try to use cached data if available
      if (lastValidPM25DataRef.current) {
        console.log('Using cached data due to error');
        setStats(prev => ({
          ...prev,
          exposureByPM25: {
            value: lastValidPM25DataRef.current.value,
            distribution: lastValidPM25DataRef.current.distribution,
            isLoading: false,
            error: null
          }
        }));
      } else {
        setStats(prev => ({
          ...prev,
          exposureByPM25: {
            value: null,
            distribution: null,
            isLoading: false,
            error: 'Failed to calculate PM2.5 exposure'
          }
        }));
      }
    }
  }, [map, polygon, currentDateTime]);

  // Use a less aggressive debounce to ensure data persists on both animation start and end
  const debouncedCalculateExposure = useCallback(
    _.debounce(() => calculateExposure(), 500, { leading: true, trailing: true }),
    [calculateExposure]
  );

  // Update census data when polygon changes
  useEffect(() => {
    updateCensusData();
  }, [updateCensusData]);

  // Update exposure when time changes - force direct calculation during animation
  useEffect(() => {
    // Skip the debounce during animation for immediate updates
    calculateExposure();
    return () => debouncedCalculateExposure.cancel();
  }, [calculateExposure, currentDateTime]);

  // Additional effect to force update during animation
  useEffect(() => {
    if (isPlaying) {
      const animationTimer = setInterval(() => {
        if (currentDateTime) {
          calculateExposure();
        }
      }, 100); // Update frequently during animation

      return () => clearInterval(animationTimer);
    }
  }, [isPlaying, calculateExposure, currentDateTime]);

  if (!polygon) return null;

  const getPM25Color = (label, isDarkMode) => {
    const level = PM25_LEVELS.find(l => l.label === label);
    if (!level) return isDarkMode ? '#00ff9d' : '#00e400'; // Default to Good color
    return isDarkMode ? level.darkColor : level.color;
  };

  return (
    <div
      className={`backdrop-blur-md rounded-lg border ${isDarkMode ? 'border-white/30' : 'border-mahogany/30'} shadow-lg px-3 py-2 ${
        isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'
      }`}
    >
      <div className="space-y-2">
        {/* Population Header - More Compact */}
        <div className="flex items-center gap-2">
          <Users2 className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-gold'}`} />
          <div className="flex-1">
            <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-forest'}`}>
              Population
            </div>
            <div
              className={`text-2xl font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-forest'}`}
            >
              {stats.censusStats.isLoading ? (
                'Calculating...'
              ) : stats.censusStats.error ? (
                'Error'
              ) : (
                <>
                  {stats.censusStats.value?.totalPopulation?.toLocaleString() || '0'}
                  <div
                    className={`text-base font-medium ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}
                  >
                    in {stats.censusStats.tractCount} census tracts
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* PM2.5 Level Distribution - Compact */}
        <div>
          <div
            className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-forest'}`}
          >
            PM<sub>2.5</sub> Level Distribution
          </div>

          {stats.exposureByPM25.error || !stats.exposureByPM25.value ? (
            // When there's no data, show 100% Good instead of error
            <div className={`rounded-md ${isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50/50'} p-2`}>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center">
                  <span
                    className="inline-block w-2 h-2 rounded-sm mr-1"
                    style={{ backgroundColor: getPM25Color('Good', isDarkMode) }}
                  />
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                    Good (0+ µg/m³)
                  </span>
                </div>
                <span className={`font-semibold ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`}>
                  100.0%
                </span>
              </div>
              {/* Single bar for Good */}
              <div className="mt-1">
                <div
                  className={`h-1.5 w-full rounded-sm ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
                >
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: '100%',
                      backgroundColor: getPM25Color('Good', isDarkMode)
                    }}
                  />
                </div>
              </div>
            </div>
          ) : stats.exposureByPM25.isLoading ? (
            <div className={`text-xs ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
              Loading PM<sub>2.5</sub> data...
            </div>
          ) : (
            <div className={`rounded-md ${isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50/50'} p-2`}>
              {/* Compact single line display of all PM2.5 levels */}
              <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                {PM25_LEVELS.map(category => {
                  // Get population for this category
                  const population = stats.exposureByPM25.value[category.label] || 0;

                  // Skip rendering if there's no population in this category
                  if (population <= 0) return null;

                  // Use distribution percentage instead of calculating from population
                  const percentage = stats.exposureByPM25.distribution
                    ? stats.exposureByPM25.distribution[category.label] || 0
                    : 0;

                  // Use the direct color method
                  const barColor = getPM25Color(category.label, isDarkMode);

                  // Simplify AQI category name display
                  let displayName;
                  if (category.label === 'Unhealthy for Sensitive Groups') {
                    displayName = 'USG';
                  } else if (category.label === 'Extremely Hazardous') {
                    displayName = 'Ext. Hazardous';
                  } else {
                    displayName = category.label;
                  }

                  return (
                    <div
                      key={category.label}
                      className={`flex items-center ${isDarkMode ? 'text-white' : 'text-gray-700'}`}
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-sm mr-1"
                        style={{ backgroundColor: barColor }}
                      />
                      <span className="font-medium">{displayName}</span>
                      <span
                        className={`ml-1 font-semibold ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`}
                      >
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  );
                }).filter(Boolean)}
              </div>

              {/* Compact stacked bar chart */}
              <div className="flex w-full h-2 rounded-sm overflow-hidden">
                {PM25_LEVELS.map(category => {
                  // Get population for this category
                  const population = stats.exposureByPM25.value[category.label] || 0;

                  // Skip rendering if there's no population in this category
                  if (population <= 0) return null;

                  // Use distribution percentage instead of calculating from population
                  const percentage = stats.exposureByPM25.distribution
                    ? stats.exposureByPM25.distribution[category.label] || 0
                    : 0;

                  // Use the direct color method
                  const barColor = getPM25Color(category.label, isDarkMode);

                  return (
                    <div
                      key={`bar-${category.label}`}
                      className="h-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: barColor
                      }}
                    />
                  );
                }).filter(Boolean)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(PopulationExposureCounter);
