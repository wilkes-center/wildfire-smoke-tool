import React, { useState, useEffect } from 'react';
import { Users2 } from 'lucide-react';
import getSelectedCensusTracts from '../../../utils/map/censusAnalysis';
import { PM25_LEVELS } from '../../../utils/map/constants';

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
        // Get census data for the selected area
        const censusData = await getSelectedCensusTracts(map, polygon);
        
        // Get the current time string
        const currentTime = `${currentDateTime.date}T${String(currentDateTime.hour).padStart(2, '0')}:00:00`;

        // Get PM2.5 features for the current time
        const pm25LayerIds = map.getStyle().layers
          .filter(layer => layer.id.startsWith('layer-'))
          .map(layer => layer.id);
        
        const pm25Features = map.queryRenderedFeatures({
          layers: pm25LayerIds
        }).filter(feature => feature.properties.time === currentTime);

        // Initialize exposure categories
        const exposureByPM25 = PM25_LEVELS.reduce((acc, category) => {
          acc[category.label] = 0;
          return acc;
        }, {});

        // Get population data
        const totalPopulation = censusData.summary.totalPopulation;
        const numTracts = Object.keys(censusData.tracts).length;

        if (pm25Features.length > 0) {
          // Calculate average PM2.5 for the area
          const avgPM25 = pm25Features.reduce((sum, feature) => 
            sum + parseFloat(feature.properties.PM25), 0) / pm25Features.length;

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
            error: 'Failed to calculate'
          },
          exposureByPM25: {
            value: null,
            isLoading: false,
            error: 'Failed to calculate'
          }
        });
      }
    };

    // Calculate stats when dependencies change
    calculateStats();
    
    // Cleanup function
    return () => {
      // Clean up highlight layers when component unmounts
      if (map) {
        ['selected-tracts-fill', 'selected-tracts-outline'].forEach(layerId => {
          if (map.getLayer(layerId)) map.removeLayer(layerId);
          if (map.getSource(layerId)) map.removeSource(layerId);
        });
      }
    };
  }, [map, polygon, currentDateTime?.date, currentDateTime?.hour]);

  if (!polygon) return null;

  if (stats.censusStats.error || stats.exposureByPM25.error) {
    return (
      <div className={`rounded-lg ${
        isDarkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-600'
      }`}>
        <p className="text-sm">Error calculating statistics</p>
      </div>
    );
  }

  // Calculate maximum population in any category for relative scaling
  const maxCategoryPopulation = stats.exposureByPM25.value ? 
    Math.max(...Object.values(stats.exposureByPM25.value)) : 0;

  return (
    <div className="space-y-4">
      {/* Population Count Section */}
      <div className="flex items-center gap-2">
        <Users2 className="w-5 h-5 text-purple-500" />
        <div>
          <div className="text-sm font-medium">Total Population</div>
          <div className={`text-xl font-semibold ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>
            {stats.censusStats.isLoading ? (
              'Calculating...'
            ) : (
              <>
                {stats.censusStats.value?.totalPopulation?.toLocaleString() || '0'} 
                <span className="text-sm font-normal text-gray-500 ml-1">
                  in {stats.censusStats.value?.numTracts || 0} tracts
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* PM2.5 Exposure Section */}
      <div className="space-y-3">
        <div className="text-sm font-medium">Population by PM2.5 Level</div>
        {!stats.exposureByPM25.isLoading && stats.exposureByPM25.value && (
          <div className="space-y-2">
            {PM25_LEVELS.map(category => {
              const population = stats.exposureByPM25.value[category.label] || 0;
              if (population === 0) return null;

              const percentage = stats.censusStats.value?.totalPopulation ? 
                (population / stats.censusStats.value.totalPopulation * 100).toFixed(1) : 0;
              const barWidth = (population / maxCategoryPopulation * 100).toFixed(1);

              return (
                <div key={category.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {category.label}
                    </span>
                    <div className="text-right">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        {population.toLocaleString()} ({percentage}%)
                      </span>
                      <div className="text-xs text-gray-400">
                        {category.value} μg/m³
                      </div>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${category.color} transition-all duration-300`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PopulationExposureCounter;