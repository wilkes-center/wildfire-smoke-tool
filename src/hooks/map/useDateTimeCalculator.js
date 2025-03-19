import { useCallback } from 'react';
import { START_DATE, TILESET_INFO } from '../../utils/map/constants.js';

export const useDateTimeCalculator = (currentHour) => {
  return useCallback(() => {
    const msPerHour = 60 * 60 * 1000;
    const currentDate = new Date(START_DATE.getTime() + (currentHour * msPerHour));
    const date = currentDate.toISOString().split('T')[0];
    const hour = currentDate.getUTCHours();
  
    const currentTileset = TILESET_INFO.find(tileset => 
      tileset.date === date && 
      hour >= tileset.startHour && 
      hour <= tileset.endHour
    );
  
    if (!currentTileset) {
      return { date: '', hour: 0 };
    }
  
    return { date, hour };
  }, [currentHour]);
};
