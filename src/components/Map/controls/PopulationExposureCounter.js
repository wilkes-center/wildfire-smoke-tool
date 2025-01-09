import React, { useState, useEffect } from 'react';
import { Users2 } from 'lucide-react';

const AQI_CATEGORIES = [
  { range: [0, 50], label: 'Good', color: '#00e400', bgClass: 'bg-green-500' },
  { range: [51, 100], label: 'Moderate', color: '#ffff00', bgClass: 'bg-yellow-500' },
  { range: [101, 150], label: 'Unhealthy for Sensitive Groups', color: '#ff7e00', bgClass: 'bg-orange-500' },
  { range: [151, 200], label: 'Unhealthy', color: '#ff0000', bgClass: 'bg-red-500' },
  { range: [201, 300], label: 'Very Unhealthy', color: '#8f3f97', bgClass: 'bg-purple-500' },
  { range: [301, 500], label: 'Hazardous', color: '#7e0023', bgClass: 'bg-rose-500' }
];

const PopulationExposureCounter = ({ map, polygon, isDarkMode, currentDateTime }) => {
  const [stats, setStats] = useState({
    totalPopulation: {
      value: null,
      isLoading: true,
      error: null
    },
    exposureByAQI: {
      value: null,
      isLoading: true,
      error: null
    }
  });

  useEffect(() => {
    if (!map || !polygon || !currentDateTime) {
      setStats(prev => ({
        totalPopulation: { ...prev.totalPopulation, isLoading: false },
        exposureByAQI: { ...prev.exposureByAQI, isLoading: false }
      }));
      return;
    }

    const calculateStats = async () => {
      // Small delay to allow map to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        const currentTime = `${currentDateTime.date}T${String(currentDateTime.hour).padStart(2, '0')}:00:00`;

        const popFeatures = map.queryRenderedFeatures({
          layers: ['population-layer']
        });

        const aqiLayerIds = map.getStyle().layers
          .filter(layer => layer.id.startsWith('layer-'))
          .map(layer => layer.id);
        
        const aqiFeatures = map.queryRenderedFeatures({
          layers: aqiLayerIds
        }).filter(feature => feature.properties.time === currentTime);

        const bounds = polygon.reduce((bounds, coord) => ({
          minLng: Math.min(bounds.minLng, coord[0]),
          maxLng: Math.max(bounds.maxLng, coord[0]),
          minLat: Math.min(bounds.minLat, coord[1]),
          maxLat: Math.max(bounds.maxLat, coord[1])
        }), {
          minLng: Infinity,
          maxLng: -Infinity,
          minLat: Infinity,
          maxLat: -Infinity
        });

        let totalPopulation = 0;
        const exposureByAQI = AQI_CATEGORIES.reduce((acc, category) => {
          acc[category.label] = 0;
          return acc;
        }, {});

        if (popFeatures.length > 0) {
          const popFeaturesInBounds = popFeatures.filter(feature => {
            if (!feature.geometry || !feature.geometry.coordinates) return false;
            const coords = feature.geometry.coordinates[0];
            return coords.some(coord => 
              coord[0] >= bounds.minLng &&
              coord[0] <= bounds.maxLng &&
              coord[1] >= bounds.minLat &&
              coord[1] <= bounds.maxLat
            );
          });

          popFeaturesInBounds.forEach(popFeature => {
            if (!popFeature.properties || popFeature.properties.DN === undefined) return;
            
            const population = popFeature.properties.DN;
            const popCenter = popFeature.geometry.coordinates[0][0];

            let closestAQI = null;
            let minDistance = Infinity;

            aqiFeatures.forEach(aqiFeature => {
              if (!aqiFeature.properties || !aqiFeature.geometry) return;

              const aqiCoord = aqiFeature.geometry.coordinates;
              const distance = Math.sqrt(
                Math.pow(aqiCoord[0] - popCenter[0], 2) +
                Math.pow(aqiCoord[1] - popCenter[1], 2)
              );

              if (distance < minDistance) {
                minDistance = distance;
                closestAQI = parseFloat(aqiFeature.properties.AQI);
              }
            });

            if (closestAQI !== null) {
              const category = AQI_CATEGORIES.find(cat => 
                closestAQI >= cat.range[0] && closestAQI <= cat.range[1]
              );
              if (category) {
                exposureByAQI[category.label] += population;
                totalPopulation += population;
              }
            }
          });
        }

        setStats({
          totalPopulation: {
            value: totalPopulation,
            isLoading: false,
            error: null
          },
          exposureByAQI: {
            value: exposureByAQI,
            isLoading: false,
            error: null
          }
        });

      } catch (error) {
        console.error('Error calculating stats:', error);
        setStats({
          totalPopulation: {
            value: null,
            isLoading: false,
            error: 'Failed to calculate'
          },
          exposureByAQI: {
            value: null,
            isLoading: false,
            error: 'Failed to calculate'
          }
        });
      }
    };

    const updateInterval = setInterval(calculateStats, 100);
    
    return () => {
      clearInterval(updateInterval);
    };
  }, [map, polygon, currentDateTime]);

  if (!polygon) return null;

  if (stats.totalPopulation.error || stats.exposureByAQI.error) {
    return (
      <div className={`rounded-lg ${
        isDarkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-600'
      }`}>
        <p className="text-sm">Error calculating statistics</p>
      </div>
    );
  }

  // Calculate maximum population in any category for relative scaling
  const maxCategoryPopulation = stats.exposureByAQI.value ? 
    Math.max(...Object.values(stats.exposureByAQI.value)) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users2 className="w-5 h-5 text-blue-500" />
        <div>
          <div className="text-sm font-medium">Total Population Exposed</div>
          <div className={`text-xl font-semibold ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>
            {stats.totalPopulation.isLoading ? (
              'Calculating...'
            ) : (
              `${stats.totalPopulation.value?.toLocaleString() || '0'} people`
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium">Population by AQI Level</div>
        {!stats.exposureByAQI.isLoading && stats.exposureByAQI.value && (
          <div className="space-y-2">
            {AQI_CATEGORIES.map(category => {
              const population = stats.exposureByAQI.value[category.label] || 0;
              if (population === 0) return null;

              const percentage = (population / stats.totalPopulation.value * 100).toFixed(1);
              const barWidth = (population / maxCategoryPopulation * 100).toFixed(1);

              return (
                <div key={category.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {category.label}
                    </span>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                      {population.toLocaleString()} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${category.bgClass} transition-all duration-300`}
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