import { useState } from 'react';

export const useTimeState = () => {
  const [currentHour, setCurrentHour] = useState(0);
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
