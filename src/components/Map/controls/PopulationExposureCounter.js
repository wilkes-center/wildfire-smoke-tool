import React, { useState, useEffect } from 'react';
import { Users2, AlertTriangle } from 'lucide-react';
import { TILESET_INFO } from '../../../utils/map/constants';

const PopulationExposureCounter = ({ map, polygon, isDarkMode, currentDateTime }) => {
  const [stats, setStats] = useState({
    maxDN: {
      value: null,
      isLoading: true,
      error: null
    },
    maxAQI: {
      value: null,
      isLoading: true,
      error: null
    },
    exposure: {
      value: null,
      isLoading: true,
      error: null
    }
  });

  useEffect(() => {
    if (!map || !polygon || !currentDateTime) {
      setStats(prev => ({
        maxDN: { ...prev.maxDN, isLoading: false },
        maxAQI: { ...prev.maxAQI, isLoading: false },
        exposure: { ...prev.exposure, isLoading: false }
      }));
      return;
    }

    const calculateStats = () => {
      try {
        // Query population features
        const popFeatures = map.queryRenderedFeatures({
          layers: ['population-layer']
        });

        // Get the proper AQI layer IDs based on the current date/time
        const aqiLayerIds = TILESET_INFO.map(tileset => `layer-${tileset.id}`);

        // Query AQI features from all available layers
        const aqiFeatures = map.queryRenderedFeatures({
          layers: aqiLayerIds
        });

        // Calculate bounds
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

        // Process population data
        let maxDNValue = 0;
        if (popFeatures.length > 0) {
          const popFeaturesInBounds = popFeatures.filter(feature => {
            const coords = feature.geometry.coordinates[0];
            return coords.some(coord => 
              coord[0] >= bounds.minLng &&
              coord[0] <= bounds.maxLng &&
              coord[1] >= bounds.minLat &&
              coord[1] <= bounds.maxLat
            );
          });

          popFeaturesInBounds.forEach(feature => {
            if (feature.properties && feature.properties.DN !== undefined) {
              maxDNValue = Math.max(maxDNValue, feature.properties.DN);
            }
          });
        }

        // Process AQI data - now uses the current time to filter features
        let maxAQIValue = 0;
        const currentTime = `${currentDateTime.date}T${String(currentDateTime.hour).padStart(2, '0')}:00:00`;
        
        if (aqiFeatures.length > 0) {
          const relevantFeatures = aqiFeatures.filter(feature => 
            feature.properties.time === currentTime
          );

          relevantFeatures.forEach(feature => {
            if (feature.properties && feature.properties.AQI !== undefined) {
              const aqi = parseFloat(feature.properties.AQI);
              if (!isNaN(aqi)) {
                maxAQIValue = Math.max(maxAQIValue, aqi);
              }
            }
          });
        }

        // Calculate exposure (population density * AQI)
        const exposureValue = maxDNValue * maxAQIValue;

        setStats({
          maxDN: {
            value: maxDNValue,
            isLoading: false,
            error: null
          },
          maxAQI: {
            value: maxAQIValue,
            isLoading: false,
            error: null
          },
          exposure: {
            value: exposureValue,
            isLoading: false,
            error: null
          }
        });

      } catch (error) {
        console.error('Error calculating stats:', error);
        setStats({
          maxDN: {
            value: null,
            isLoading: false,
            error: 'Failed to calculate'
          },
          maxAQI: {
            value: null,
            isLoading: false,
            error: 'Failed to calculate'
          },
          exposure: {
            value: null,
            isLoading: false,
            error: 'Failed to calculate'
          }
        });
      }
    };

    calculateStats();
  }, [map, polygon, currentDateTime]);

  if (!polygon) {
    return null;
  }

  if (stats.maxDN.error || stats.maxAQI.error || stats.exposure.error) {
    return (
      <div className={`rounded-lg ${
        isDarkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-600'
      }`}>
        <p className="text-sm">Error calculating statistics</p>
      </div>
    );
  } 

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users2 className="w-5 h-5 text-blue-500" />
        <div>
          <div className="text-sm font-medium">Max Population Density</div>
          <div className={`text-xl font-semibold ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>
            {stats.maxDN.isLoading ? (
              'Calculating...'
            ) : (
              `${stats.maxDN.value?.toString() || '0'} people/km²`
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-yellow-500" />
        <div>
          <div className="text-sm font-medium">Population Exposure Index</div>
          <div className={`text-xl font-semibold ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>
            {stats.exposure.isLoading ? (
              'Calculating...'
            ) : (
              stats.exposure.value?.toLocaleString(undefined, {
                maximumFractionDigits: 0
              }) || '0'
            )}
          </div>
          <div className="text-xs text-gray-500">
            Max AQI: {stats.maxAQI.value?.toFixed(1) || '0'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopulationExposureCounter;