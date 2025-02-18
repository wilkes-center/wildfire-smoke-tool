import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Users2 } from 'lucide-react';
import _ from 'lodash';
import getSelectedCensusTracts from '../../../utils/map/censusAnalysis';
import { PM25_LEVELS, TILESET_INFO } from '../../../utils/map/constants';
import { NEON_PM25_COLORS } from '../../../utils/map/colors';

const PopulationExposureCounter = ({ map, polygon, isDarkMode, currentDateTime }) => {
  const [stats, setStats] = useState({
    censusStats: {
      value: null,
      isLoading: true,
      error: null,
      tractCount: 0
    },
    exposureByPM25: {
      value: null,
      isLoading: true,
      error: null
    }
  });

  // Keep track of census data separately to avoid recalculation
  const censusDataRef = useRef(null);
  
  const lastCalculation = useRef({
    polygon: null,
    time: null,
    result: null
  });

  const getCurrentTilesetInfo = useCallback((date, hour) => {
    return TILESET_INFO.find(tileset => 
      tileset.date === date && 
      hour >= tileset.startHour && 
      hour <= tileset.endHour
    );
  }, []);

  // Helper function to determine PM2.5 category
  const getPM25Category = (pm25Value) => {
    return PM25_LEVELS.find((level, index) => {
      const nextLevel = PM25_LEVELS[index + 1];
      return pm25Value >= level.value && (!nextLevel || pm25Value < nextLevel.value);
    });
  };

  // Fetch census data independently of PM2.5 calculations
  const updateCensusData = useCallback(async () => {
    if (!map || !polygon) return;

    try {
      const data = await getSelectedCensusTracts(map, polygon, isDarkMode);
      censusDataRef.current = data;
      
      setStats(prev => ({
        ...prev,
        censusStats: {
          value: { 
            totalPopulation: data.summary.totalPopulation,
            avgPM25: prev.censusStats.value?.avgPM25 || 0 
          },
          isLoading: false,
          error: null,
          tractCount: Object.keys(data.tracts).length
        }
      }));
    } catch (error) {
      console.error('Error fetching census data:', error);
      setStats(prev => ({
        ...prev,
        censusStats: {
          value: null,
          isLoading: false,
          error: 'Failed to fetch census data',
          tractCount: 0
        }
      }));
    }
  }, [map, polygon, isDarkMode]);

  const calculateExposure = useCallback(async () => {
    if (!map || !polygon || !currentDateTime || !censusDataRef.current) {
      return;
    }

    // Generate cache key
    const timeKey = `${currentDateTime.date}-${currentDateTime.hour}`;
    
    // Check if we have a cached result for the same inputs
    if (lastCalculation.current.polygon === polygon && 
        lastCalculation.current.time === timeKey &&
        lastCalculation.current.result) {
      setStats(prev => ({
        ...prev,
        exposureByPM25: lastCalculation.current.result.exposureByPM25
      }));
      return;
    }

    try {
      const currentTileset = getCurrentTilesetInfo(currentDateTime.date, currentDateTime.hour);
      
      if (!currentTileset) {
        console.warn('No tileset found for current datetime:', currentDateTime);
        return;
      }

      const layerId = `layer-${currentTileset.id}`;
      
      if (!map.getLayer(layerId)) {
        setStats(prev => ({
          ...prev,
          exposureByPM25: {
            value: prev.exposureByPM25.value, // Maintain previous values
            isLoading: false,
            error: 'Loading data for this time period...'
          }
        }));
        return;
      }

      const totalPopulation = censusDataRef.current.summary.totalPopulation;
      const timeString = `${currentDateTime.date}T${String(currentDateTime.hour).padStart(2, '0')}:00:00`;

      // Calculate bounds
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

      const features = map.queryRenderedFeatures([sw, ne], {
        layers: [layerId],
        filter: ['==', ['get', 'time'], timeString]
      }).filter(feature => {
        if (!feature.geometry || !feature.geometry.coordinates) return false;
        return isPointInPolygon(feature.geometry.coordinates, polygon);
      });

      // Initialize exposure categories with the total population for Good category
      const exposureByPM25 = PM25_LEVELS.reduce((acc, level) => {
        acc[level.label] = level.label === 'Good' ? totalPopulation : 0;
        return acc;
      }, {});

      let calculatedAvgPM25 = 0;

      if (features.length > 0) {
        // Calculate average PM2.5
        calculatedAvgPM25 = features.reduce((sum, feature) => {
          const pm25 = parseFloat(feature.properties.PM25);
          return isNaN(pm25) ? sum : sum + pm25;
        }, 0) / features.length;

        // Get category for the average PM2.5
        const category = getPM25Category(calculatedAvgPM25);

        if (category) {
          // Set population for the current category and all lower categories
          const categoryIndex = PM25_LEVELS.findIndex(level => level.label === category.label);
          
          // Distribute population across relevant categories
          PM25_LEVELS.forEach((level, index) => {
            if (index <= categoryIndex) {
              exposureByPM25[level.label] = totalPopulation;
            }
          });
        }
      }

      const newStats = {
        censusStats: {
          value: { totalPopulation, avgPM25: calculatedAvgPM25 },
          isLoading: false,
          error: null,
          tractCount: Object.keys(censusDataRef.current.tracts).length
        },
        exposureByPM25: {
          value: exposureByPM25,
          isLoading: false,
          error: null
        }
      };

      // Update cache
      lastCalculation.current = {
        polygon,
        time: timeKey,
        result: newStats
      };

      setStats(newStats);

    } catch (error) {
      console.error('Error calculating exposure:', error);
      // Maintain previous exposure values in case of error
      setStats(prev => ({
        ...prev,
        exposureByPM25: {
          value: prev.exposureByPM25.value,
          isLoading: false,
          error: 'Failed to calculate exposure'
        }
      }));
    }
  }, [map, polygon, currentDateTime, getCurrentTilesetInfo]);

  // Update census data when polygon changes
  useEffect(() => {
    updateCensusData();
  }, [updateCensusData]);

  // Debounced version of calculateExposure
  const debouncedCalculateExposure = useCallback(
    _.debounce(() => calculateExposure(), 1000, { leading: true, trailing: true }),
    [calculateExposure]
  );

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

// Helper function for point-in-polygon check
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

export default React.memo(PopulationExposureCounter);