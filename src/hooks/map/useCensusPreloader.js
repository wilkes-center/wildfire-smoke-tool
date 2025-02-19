// src/hooks/map/useCensusPreloader.js
import { useState, useEffect } from 'react';
import { censusPreloader } from '../../utils/map/censusPreloader';

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
    const unsubscribe = censusPreloader.onProgress(({ stage, progress }) => {
      setProgress(prev => ({
        ...prev,
        [stage]: progress
      }));
    });

    // Start preloading
    censusPreloader
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
      censusPreloader.updateColors(map, isDarkMode);
    }
  }, [isDarkMode, map, status]);

  return {
    progress,
    status,
    error,
    isComplete: status === 'complete'
  };
};