import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Users2 } from 'lucide-react';
import getSelectedCensusTracts from '../../../utils/map/censusAnalysis';
import { PM25_LEVELS, TILESET_INFO } from '../../../utils/map/constants';

const PopulationExposureCounter = ({ map, polygon, isDarkMode, currentDateTime }) => {
  const [stats, setStats] = useState({
    censusStats: {
      value: null,
      isLoading: true,
      error: null
    },
    exposureByPM25: {
      value: null,
      isLoading: true,
      error: null
    }
  });
  
  const censusDataRef = useRef(null);
  const lastValidStatsRef = useRef(null);
  const currentLayerRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  const isPointInPolygon = useCallback((point, polygon) => {
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
  }, []);

  const fetchCensusData = useCallback(async () => {
    if (!map || !polygon) return null;
    try {
      const data = await getSelectedCensusTracts(map, polygon, isDarkMode);
      censusDataRef.current = data;
      return data;
    } catch (error) {
      console.error('Error fetching census data:', error);
      return null;
    }
  }, [map, polygon, isDarkMode]);

  const getCurrentTileset = useCallback(() => {
    if (!currentDateTime) return null;
    return TILESET_INFO.find(tileset => 
      tileset.date === currentDateTime.date && 
      currentDateTime.hour >= tileset.startHour && 
      currentDateTime.hour <= tileset.endHour
    );
  }, [currentDateTime]);

  const queryFeatures = useCallback((layerId, currentTime) => {
    if (!map || !polygon) return [];
    
    try {
      return map.queryRenderedFeatures(undefined, {
        layers: [layerId],
        filter: [
          'all',
          ['==', ['get', 'time'], currentTime]
        ]
      }).filter(feature => {
        const coords = feature.geometry.coordinates;
        return isPointInPolygon(coords, polygon);
      });
    } catch (error) {
      console.error('Error querying features:', error);
      return [];
    }
  }, [map, polygon, isPointInPolygon]);

  const calculateExposure = useCallback(async (retryCount = 0) => {
    if (!map || !polygon || !currentDateTime || !censusDataRef.current) return;

    try {
      const currentTime = `${currentDateTime.date}T${String(currentDateTime.hour).padStart(2, '0')}:00:00`;
      const currentTileset = getCurrentTileset();

      if (!currentTileset) {
        console.warn('No tileset found for current time');
        return;
      }

      const layerId = `layer-${currentTileset.id}`;
      
      // Check if layer exists and is loaded
      if (!map.getLayer(layerId) || !map.isStyleLoaded()) {
        if (retryCount < 3) {
          // Retry with exponential backoff
          const delay = Math.min(100 * Math.pow(2, retryCount), 1000);
          retryTimeoutRef.current = setTimeout(() => {
            calculateExposure(retryCount + 1);
          }, delay);
          return;
        }
        // If we've exhausted retries, use last valid stats
        if (lastValidStatsRef.current) {
          setStats(lastValidStatsRef.current);
        }
        return;
      }

      currentLayerRef.current = layerId;
      const features = queryFeatures(layerId, currentTime);

      // Initialize exposure categories
      const exposureByPM25 = PM25_LEVELS.reduce((acc, category) => {
        acc[category.label] = 0;
        return acc;
      }, {});

      const totalPopulation = censusDataRef.current.summary.totalPopulation;
      const numTracts = Object.keys(censusDataRef.current.tracts).length;

      if (features.length > 0) {
        const avgPM25 = features.reduce((sum, feature) => 
          sum + parseFloat(feature.properties.PM25), 0) / features.length;

        const category = PM25_LEVELS.find((level, index) => {
          const nextLevel = PM25_LEVELS[index + 1];
          return avgPM25 >= level.value && (!nextLevel || avgPM25 < nextLevel.value);
        });
        
        if (category) {
          exposureByPM25[category.label] = totalPopulation;
        }
      }

      const newStats = {
        censusStats: {
          value: { totalPopulation, numTracts },
          isLoading: false,
          error: null
        },
        exposureByPM25: {
          value: exposureByPM25,
          isLoading: false,
          error: null
        }
      };

      // Only update if the data is valid
      if (totalPopulation > 0) {
        lastValidStatsRef.current = newStats;
        setStats(newStats);
      } else if (lastValidStatsRef.current) {
        setStats(lastValidStatsRef.current);
      }

    } catch (error) {
      console.error('Error calculating exposure:', error);
      if (lastValidStatsRef.current) {
        setStats(lastValidStatsRef.current);
      }
    }
  }, [map, polygon, currentDateTime, getCurrentTileset, queryFeatures]);

  // Handle initial census data loading
  useEffect(() => {
    const loadCensusData = async () => {
      await fetchCensusData();
      calculateExposure();
    };

    loadCensusData();

    return () => {
      censusDataRef.current = null;
      lastValidStatsRef.current = null;
    };
  }, [fetchCensusData, calculateExposure]);

  // Handle updates to time and map
  useEffect(() => {
    if (!map || !polygon || !currentDateTime || !censusDataRef.current) return;

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      calculateExposure();
    }, 50);

    return () => {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [map, polygon, currentDateTime, calculateExposure]);

  // Handle map style updates
  useEffect(() => {
    if (!map) return;

    const handleStyleData = () => {
      if (censusDataRef.current) {
        calculateExposure();
      }
    };

    map.on('styledata', handleStyleData);

    return () => {
      map.off('styledata', handleStyleData);
    };
  }, [map, calculateExposure]);

  if (!polygon) return null;

  if (stats.censusStats.error || stats.exposureByPM25.error) {
    return (
      <div className={`rounded-lg ${
        isDarkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-600'
      } p-4`}>
        <p className="text-sm">Error calculating population exposure</p>
      </div>
    );
  }

  const maxCategoryPopulation = stats.exposureByPM25.value ? 
    Math.max(...Object.values(stats.exposureByPM25.value)) : 0;

  return (
    <div className={`backdrop-blur-sm rounded-lg shadow-lg px-4 py-3 border-2 border-purple-500 ${
      isDarkMode ? 'bg-gray-900/95 text-gray-200' : 'bg-white/95 text-gray-800'
    }`}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users2 className="w-5 h-5 text-purple-400" />
          <div>
            <div className={`text-sm font-medium ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Total Population</div>
            <div className={`text-xl font-semibold ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {stats.censusStats.isLoading ? (
                'Calculating...'
              ) : (
                <>
                  {stats.censusStats.value?.totalPopulation?.toLocaleString() || '0'} 
                  <span className={`text-sm font-normal ml-1 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    in {stats.censusStats.value?.numTracts || 0} tracts
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className={`text-sm font-medium ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Population by PM2.5 Level</div>
          {!stats.exposureByPM25.isLoading && stats.exposureByPM25.value && (
            <div className="space-y-2">
              {PM25_LEVELS.map(category => {
                const population = stats.exposureByPM25.value[category.label] || 0;
                if (population === 0) return null;

                const percentage = stats.censusStats.value?.totalPopulation ? 
                  (population / stats.censusStats.value.totalPopulation * 100).toFixed(1) : 0;

                return (
                  <div key={category.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className={`font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {category.label}
                      </span>
                      <div className="text-right">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                          {population.toLocaleString()} ({percentage}%)
                        </span>
                        <div className={`text-xs ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {category.value} μg/m³
                        </div>
                      </div>
                    </div>
                    <div className={`h-2 w-full rounded-full overflow-hidden ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div 
                        className={`h-full ${category.color} transition-all duration-300`}
                        style={{ width: `${(population / maxCategoryPopulation * 100).toFixed(1)}%` }}
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

export default PopulationExposureCounter;