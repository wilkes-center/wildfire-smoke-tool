import { useEffect, useRef } from 'react';

import { TOTAL_HOURS } from '../../utils/map/constants.js';

export const useTimeAnimation = (isPlaying, playbackSpeed, setCurrentHour) => {
  const animationFrameRef = useRef(null);
  const lastTimestampRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const initializedRef = useRef(false);

  // Handle initial frame tick to trigger data loading
  useEffect(() => {
    if (initializedRef.current) return;

    // Ensures map layers get loaded properly on first render
    setCurrentHour(hour => {
      if (hour === 0) {
        // Quick toggle to ensure data loading is properly triggered
        setTimeout(() => setCurrentHour(1), 200);
        setTimeout(() => setCurrentHour(0), 400);
      }
      return hour;
    });

    initializedRef.current = true;
  }, [setCurrentHour]);

  // Main animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animationDuration = 1000 / playbackSpeed;

    const animate = timestamp => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      const elapsed = timestamp - lastTimestampRef.current;

      if (elapsed >= animationDuration && !isAnimatingRef.current) {
        isAnimatingRef.current = true;

        setCurrentHour(prevHour => {
          const nextHour = prevHour + 1;
          return nextHour >= TOTAL_HOURS ? 0 : nextHour;
        });

        lastTimestampRef.current = timestamp;
        isAnimatingRef.current = false;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation loop
    lastTimestampRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup on unmount or when animation stops
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, playbackSpeed, setCurrentHour]);
};
