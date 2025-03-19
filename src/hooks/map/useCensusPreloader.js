// src/hooks/map/useCensusPreloader.js
import { useState, useEffect } from 'react';
import { censusLayerManager } from '../../utils/map/CensusLayerManager';

export const useCensusPreloader = (map, isDarkMode) => {
  const [progress, setProgress] = useState({
    layer: 0,
    data: 0,
    overall: 0
  });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!map) return;

    setStatus('loading');
    setError(null);

    // Subscribe to progress updates
    const unsubscribe = censusLayerManager.onProgress(({ stage, progress }) => {
      setProgress(prev => ({
        ...prev,
        [stage]: progress
      }));
    });

    // Start preloading
    censusLayerManager
      .preloadAll(map, isDarkMode)
      .then(() => {
        setStatus('complete');
      })
      .catch((err) => {
        console.error('Preload error:', err);
        setError(err.message);
        setStatus('error');
      });

    return () => {
      unsubscribe();
    };
  }, [map, isDarkMode]);

  // Update colors when theme changes
  useEffect(() => {
    if (map && status === 'complete') {
      censusLayerManager.updateColors(map, isDarkMode);
    }
  }, [isDarkMode, map, status]);

  return {
    progress,
    status,
    error,
    isComplete: status === 'complete'
  };
};