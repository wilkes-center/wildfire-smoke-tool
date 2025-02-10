import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!map || !polygon || !currentDateTime) {
      setStats(prev => ({
        censusStats: { ...prev.censusStats, isLoading: false },
        exposureByPM25: { ...prev.exposureByPM25, isLoading: false }
      }));
      return;
    }

    const calculateStats = async () => {
      try {
        // Wait for map style to be loaded
        if (!map.isStyleLoaded()) {
          await new Promise(resolve => {
            map.once('style.load', resolve);
          });
        }

        // Get census data for the selected area
        const censusData = await getSelectedCensusTracts(map, polygon, isDarkMode);
        
        // Format time string
        const currentTime = `${currentDateTime.date}T${String(currentDateTime.hour).padStart(2, '0')}:00:00`;

        // Find the current tileset
        const currentTileset = TILESET_INFO.find(tileset => 
          tileset.date === currentDateTime.date && 
          currentDateTime.hour >= tileset.startHour && 
          currentDateTime.hour <= tileset.endHour
        );

        if (!currentTileset) {
          throw new Error('No tileset found for current time');
        }

        // Query features from the correct layer
        const layerId = `layer-${currentTileset.id}`;
        const features = map.queryRenderedFeatures({
          layers: [layerId],
          filter: [
            'all',
            ['==', ['get', 'time'], currentTime]
          ]
        }).filter(feature => {
          const coords = feature.geometry.coordinates;
          return isPointInPolygon(coords, polygon);
        });

        // Initialize exposure categories
        const exposureByPM25 = PM25_LEVELS.reduce((acc, category) => {
          acc[category.label] = 0;
          return acc;
        }, {});

        // Get population data
        const totalPopulation = censusData.summary.totalPopulation;
        const numTracts = Object.keys(censusData.tracts).length;

        if (features.length > 0) {
          // Calculate average PM2.5 for the area
          const avgPM25 = features.reduce((sum, feature) => 
            sum + parseFloat(feature.properties.PM25), 0) / features.length;

          // Find the appropriate PM2.5 category
          const category = PM25_LEVELS.find((level, index) => {
            const nextLevel = PM25_LEVELS[index + 1];
            return avgPM25 >= level.value && (!nextLevel || avgPM25 < nextLevel.value);
          });
          
          if (category) {
            exposureByPM25[category.label] = totalPopulation;
          }
        }

        setStats({
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
        });

      } catch (error) {
        console.error('Error calculating stats:', error);
        setStats({
          censusStats: {
            value: null,
            isLoading: false,
            error: 'Failed to calculate census statistics'
          },
          exposureByPM25: {
            value: null,
            isLoading: false,
            error: 'Failed to calculate exposure statistics'
          }
        });
      }
    };

    calculateStats();
  }, [map, polygon, currentDateTime, isDarkMode]);

  // Helper function to check if a point is within a polygon
  const isPointInPolygon = (point, polygon) => {
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

  // Calculate maximum population in any category for relative scaling
  const maxCategoryPopulation = stats.exposureByPM25.value ? 
    Math.max(...Object.values(stats.exposureByPM25.value)) : 0;

    return (
<div className={`backdrop-blur-sm rounded-lg shadow-lg px-4 py-3 border-2 border-purple-500 ${
        isDarkMode ? 'bg-gray-900/95 text-gray-200' : 'bg-white/95 text-gray-800'
      }`}>
    <div className="space-y-4">
      {/* Population Count Section */}
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

      {/* PM2.5 Exposure Section */}
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