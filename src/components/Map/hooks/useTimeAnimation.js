import { useEffect, useRef } from 'react';
import { TOTAL_HOURS } from '../constants';

export const useTimeAnimation = (isPlaying, playbackSpeed, setCurrentHour) => {
  const animationFrameRef = useRef(null);
  const lastTimestampRef = useRef(0);

  useEffect(() => {
    const animationDuration = 1000 / playbackSpeed;

    const animate = (timestamp) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
      const elapsed = timestamp - lastTimestampRef.current;

      if (elapsed >= animationDuration) {
        setCurrentHour((prevHour) => {
          let nextHour = (prevHour + 1) % TOTAL_HOURS;
          // Remove the condition that was causing the jump
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
