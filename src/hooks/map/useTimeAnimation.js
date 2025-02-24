import { useEffect, useRef } from 'react';
import { TOTAL_HOURS } from '../../utils/map/constants.js';

export const useTimeAnimation = (isPlaying, playbackSpeed, setCurrentHour) => {
  const animationFrameRef = useRef(null);
  const lastTimestampRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {

    if (initializedRef.current) return;

    setCurrentHour(hour => {

      if (hour === 0) {
        setTimeout(() => setCurrentHour(1), 200);
        setTimeout(() => setCurrentHour(0), 400);
      }
      return hour;
    });
    
    initializedRef.current = true;
  }, [setCurrentHour]);

  // Standard animation logic
  useEffect(() => {
    const animationDuration = 1000 / playbackSpeed; // ms per hour

    const animate = (timestamp) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }
      
      const elapsed = timestamp - lastTimestampRef.current;

      if (elapsed >= animationDuration) {
        if (!isAnimatingRef.current) {
          isAnimatingRef.current = true;
          setCurrentHour(prevHour => {
            const nextHour = prevHour + 1;
            if (nextHour >= TOTAL_HOURS) {
              return 0;
            }
            return nextHour;
          });
          isAnimatingRef.current = false;
          lastTimestampRef.current = timestamp;
        }
      }

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying && !animationFrameRef.current) {
      lastTimestampRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, playbackSpeed, setCurrentHour]);
};