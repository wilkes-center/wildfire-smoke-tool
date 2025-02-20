import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Users2 } from 'lucide-react';
import _ from 'lodash';
import { PM25_LEVELS, TILESET_INFO } from '../../../utils/map/constants';
import { NEON_PM25_COLORS } from '../../../utils/map/colors';
import getSelectedCensusTracts from '../../../utils/map/censusAnalysis';

// Helper for point-in-polygon check
const isPointInPolygon = (point, polygon) => {
  if (!Array.isArray(point) || point.length < 2) return false;
  
  const x = point[0], y = point[1];
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
};

// Find active layer for current time
const findActiveLayer = (map, date, hour) => {
  if (!map || !map.getStyle()) return null;

  // Find matching tileset for current date and hour
  const tileset = TILESET_INFO.find(t => 
    t.date === date && 
    hour >= t.startHour && 
    hour <= t.endHour
  );

  if (!tileset) {
    console.warn('No tileset found for:', { date, hour });
    return null;
  }

  const layerId = `layer-${tileset.id}`;
  return map.getLayer(layerId) ? layerId : null;
};

const PopulationExposureCounter = ({ map, polygon, isDarkMode, currentDateTime }) => {
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
      error: null
    }
  });

  // Keep track of census data separately
  const censusDataRef = useRef(null);

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
    if (!map || !polygon || !currentDateTime || !censusDataRef.current) {
      return;
    }

    try {
      setStats(prev => ({
        ...prev,
        exposureByPM25: {
          ...prev.exposureByPM25,
          isLoading: true,
          error: null
        }
      }));

      const timeString = `${currentDateTime.date}T${String(currentDateTime.hour).padStart(2, '0')}:00:00`;

      // Find active layer
      const activeLayer = findActiveLayer(map, currentDateTime.date, currentDateTime.hour);
      
      if (!activeLayer) {
        setStats(prev => ({
          ...prev,
          exposureByPM25: {
            value: null,
            isLoading: false,
            error: 'Loading data for this time period...'
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

      const lngPad = (bounds.maxLng - bounds.minLng) * 0.2;
      const latPad = (bounds.maxLat - bounds.minLat) * 0.2;
      bounds.minLng -= lngPad;
      bounds.maxLng += lngPad;
      bounds.minLat -= latPad;
      bounds.maxLat += latPad;

      const sw = map.project([bounds.minLng, bounds.minLat]);
      const ne = map.project([bounds.maxLng, bounds.maxLat]);

      // Query features
      const features = map.queryRenderedFeatures([sw, ne], {
        layers: [activeLayer],
        filter: ['==', ['get', 'time'], timeString]
      }).filter(feature => {
        if (!feature.geometry || !feature.geometry.coordinates) return false;
        return isPointInPolygon(feature.geometry.coordinates, polygon);
      });

      // Initialize exposure categories
      const exposureByPM25 = PM25_LEVELS.reduce((acc, level) => {
        acc[level.label] = 0;
        return acc;
      }, {});

      let calculatedAvgPM25 = 0;

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

        // Calculate average PM2.5 and distribute population
        if (pm25Grid.length > 0) {
          calculatedAvgPM25 = pm25Grid.reduce((sum, point) => sum + point.pm25, 0) / pm25Grid.length;

          // Get census data
          const totalPopulation = censusDataRef.current.summary.totalPopulation;

          // For each PM2.5 grid point, assign population proportion
          pm25Grid.forEach(gridPoint => {
            const category = PM25_LEVELS.find((level, index) => {
              const nextLevel = PM25_LEVELS[index + 1];
              return gridPoint.pm25 >= level.value && (!nextLevel || gridPoint.pm25 < nextLevel.value);
            });

            if (category) {
              // Distribute population evenly across grid points
              const pointContribution = totalPopulation / pm25Grid.length;
              exposureByPM25[category.label] += pointContribution;
            }
          });

          // Round the values
          Object.keys(exposureByPM25).forEach(key => {
            exposureByPM25[key] = Math.round(exposureByPM25[key]);
          });
        }
      }

      setStats(prev => ({
        ...prev,
        censusStats: {
          ...prev.censusStats,
          value: { ...prev.censusStats.value, avgPM25: calculatedAvgPM25 }
        },
        exposureByPM25: {
          value: exposureByPM25,
          isLoading: false,
          error: null
        }
      }));

    } catch (error) {
      console.error('Error calculating exposure:', error);
      setStats(prev => ({
        ...prev,
        exposureByPM25: {
          value: prev.exposureByPM25.value,
          isLoading: false,
          error: 'Failed to calculate exposure'
        }
      }));
    }
  }, [map, polygon, currentDateTime]);

  // Debounced version of calculateExposure
  const debouncedCalculateExposure = useCallback(
    _.debounce(() => calculateExposure(), 1000, { leading: true, trailing: true }),
    [calculateExposure]
  );

  // Update census data when polygon changes
  useEffect(() => {
    updateCensusData();
  }, [updateCensusData]);

  // Update exposure when time changes
  useEffect(() => {
    if (censusDataRef.current) {
      debouncedCalculateExposure();
    }
    return () => debouncedCalculateExposure.cancel();
  }, [debouncedCalculateExposure]);

  if (!polygon) return null;

  return (
    <div className={`backdrop-blur-md rounded-xl border-2 border-purple-500 shadow-lg px-6 py-4 ${
      isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'
    }`}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users2 className="w-5 h-5 text-purple-400" />
          <div>
            <div className={`text-sm font-medium ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Population</div>
            <div className={`text-xl font-semibold ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {stats.censusStats.isLoading ? (
                'Calculating...'
              ) : stats.censusStats.error ? (
                'Error calculating population'
              ) : (
                <>
                  {stats.censusStats.value?.totalPopulation?.toLocaleString() || '0'}
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    in {stats.censusStats.tractCount} Census Tracts
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className={`text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Population by PM2.5 Level</div>
          
          {stats.exposureByPM25.error ? (
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {stats.exposureByPM25.error}
            </div>
          ) : !stats.exposureByPM25.isLoading && stats.exposureByPM25.value && (
            <div className={`mt-2 rounded-lg ${
                isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'
              } p-3 space-y-2`}>
              {PM25_LEVELS.map(category => {
                const population = stats.exposureByPM25.value[category.label] || 0;
                if (population === 0) return null;

                const percentage = stats.censusStats.value?.totalPopulation ?
                  (population / stats.censusStats.value.totalPopulation * 100).toFixed(1) : 0;

                return (
                  <div key={category.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        {category.label} ({category.value}+)
                      </span>
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        {population.toLocaleString()} ({percentage}%)
                      </span>
                    </div>
                    <div className={`h-2 w-full rounded-lg overflow-hidden ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: isDarkMode ? 
                            NEON_PM25_COLORS.darkMode[category.label.toLowerCase().replace(/\s+/g, '')] || '#00ff9d' : 
                            NEON_PM25_COLORS.lightMode[category.label.toLowerCase().replace(/\s+/g, '')] || '#00e400'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(PopulationExposureCounter);