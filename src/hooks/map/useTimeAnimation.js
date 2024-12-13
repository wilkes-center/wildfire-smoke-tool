import { useEffect, useRef } from 'react';
import { START_DATE, END_DATE, TOTAL_HOURS, MAPBOX_TOKEN } from '../../utils/map/constants.js'; 


export const useTimeAnimation = (isPlaying, playbackSpeed, setCurrentHour) => {
  const animationFrameRef = useRef(null);
  const lastTimestampRef = useRef(0);

  useEffect(() => {
    const animationDuration = 1000 / playbackSpeed;

    const animate = (timestamp) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
      const elapsed = timestamp - lastTimestampRef.current;

      if (elapsed >= animationDuration) {
        setCurrentHour(prevHour => {
          const nextHour = prevHour + 1;
          if (nextHour >= TOTAL_HOURS) {
            return 0; // Loop back to start
          }
          return nextHour;
        });
        lastTimestampRef.current = timestamp;
      }

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, setCurrentHour]);
};
