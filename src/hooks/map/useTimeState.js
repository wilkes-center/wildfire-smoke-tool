import { useState } from 'react';

import { START_DATE, TOTAL_HOURS } from '../../utils/map/constants';
import { getCurrentTimelineHour } from '../../utils/map/timeUtils';

/**
 * Hook for managing time state in the application
 * Automatically initializes to the user's current time within the data timeline
 * @returns {Object} Time state and setters
 */
export const useTimeState = () => {
  // Calculate initial hour based on current time
  // This ensures the app starts showing data for the current time
  // rather than always starting at hour 0
  const initialHour = getCurrentTimelineHour(START_DATE, TOTAL_HOURS);

  const [currentHour, setCurrentHour] = useState(initialHour);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(3);

  return {
    currentHour,
    setCurrentHour,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed
  };
};
