import { useCallback } from 'react';
import { START_DATE, TILESET_INFO } from '../../utils/map/constants.js';

export const useDateTimeCalculator = (currentHour) => {
  return useCallback(() => {
    // Debug logging to see what's in the TILESET_INFO array
    console.log('START_DATE:', START_DATE);
    console.log('TILESET_INFO tiles:', TILESET_INFO.map(t => ({ 
      id: t.id, 
      date: t.date, 
      hours: `${t.startHour}-${t.endHour}` 
    })));
    
    // Extract exact metadata from TILESET_INFO to determine which data we should be showing
    const hoursInDay = 24;
    const dayIndex = Math.floor(currentHour / hoursInDay); // 0, 1, 2, or 3 (day in the 4-day timeline)
    const hourOfDay = currentHour % hoursInDay; // Hour within the day (0-23)
    
    // Force dates to match TILESET_INFO exactly 
    // Instead of calculating the index based on offset from the start date,
    // we'll just use TILESET_INFO in order
    //
    // Timeline hours correspond to:
    // - hour 0-23 (day 0) -> TILESET_INFO[0] and [1]
    // - hour 24-47 (day 1) -> TILESET_INFO[2] and [3]
    // - hour 48-71 (day 2) -> TILESET_INFO[4] and [5]
    // - hour 72-95 (day 3) -> TILESET_INFO[6] and [7]
    
    // First determine which of the 4 days we're viewing (0-3)
    const tilesetDay = Math.min(dayIndex, 3); // Clamp to 0-3 range
    
    // Then determine which chunk within that day (0 for morning, 1 for afternoon)
    const isAfternoon = hourOfDay >= 12;
    
    // Calculate the index in the TILESET_INFO array (0-7)
    const tilesetIndex = (tilesetDay * 2) + (isAfternoon ? 1 : 0);
    
    // Get the matching tileset
    const currentTileset = tilesetIndex < TILESET_INFO.length ? TILESET_INFO[tilesetIndex] : null;
    
    if (!currentTileset) {
      console.error(`Failed to get tileset at index ${tilesetIndex}`);
      // Fallback to direct calculation using START_DATE
      const displayDate = new Date(START_DATE.getTime());
      displayDate.setUTCDate(displayDate.getUTCDate() + dayIndex);
      displayDate.setUTCHours(hourOfDay, 0, 0, 0);
      const date = displayDate.toISOString().split('T')[0];
      return { date, hour: hourOfDay };
    }
    
    // Get the date for the current day from the tileset
    const date = currentTileset.date;
    
    console.log(`Current hour ${currentHour} -> Day ${dayIndex} (tileset day ${tilesetDay}), Hour ${hourOfDay} -> Tileset ${currentTileset.id}`);
    
    return { 
      date, 
      hour: hourOfDay, 
      tileset: currentTileset.id,
      tilesetHourRange: `${currentTileset.startHour}-${currentTileset.endHour}`
    };
  }, [currentHour]);
};
