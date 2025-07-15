import { useCallback } from 'react';

import { START_DATE, TILESET_INFO } from '../../utils/map/constants.js';

export const useDateTimeCalculator = currentHour => {
  return useCallback(() => {
    // Debug logging to see what's in the TILESET_INFO array
    console.log('START_DATE:', START_DATE);
    console.log(
      'TILESET_INFO tiles:',
      TILESET_INFO.map(t => ({
        id: t.id,
        date: t.date,
        hours: `${t.startHour}-${t.endHour}`
      }))
    );

    // Extract exact metadata from TILESET_INFO to determine which data we should be showing
    const hoursInDay = 24;
    const dayIndex = Math.floor(currentHour / hoursInDay); // 0 or 1 (day in the 2-day timeline)
    const hourOfDay = currentHour % hoursInDay; // Hour within the day (0-23)

    // Force dates to match TILESET_INFO exactly
    // Timeline hours correspond to:
    // - hour 0-23 (day 0) -> TILESET_INFO[0], [1], [2], and [3]
    // - hour 24-47 (day 1) -> TILESET_INFO[4], [5], [6], and [7]

    // First determine which of the 2 days we're viewing (0-1)
    const tilesetDay = Math.min(dayIndex, 1); // Clamp to 0-1 range

    // Then determine which chunk within that day based on 6-hour segments
    let chunkIndex;
    if (hourOfDay < 6) {
      chunkIndex = 0; // 00:00-05:59
    } else if (hourOfDay < 12) {
      chunkIndex = 1; // 06:00-11:59
    } else if (hourOfDay < 18) {
      chunkIndex = 2; // 12:00-17:59
    } else {
      chunkIndex = 3; // 18:00-23:59
    }

    // Calculate the index in the TILESET_INFO array (0-7)
    const tilesetIndex = tilesetDay * 4 + chunkIndex;

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

    console.log(
      `Current hour ${currentHour} -> Day ${dayIndex} (tileset day ${tilesetDay}), Hour ${hourOfDay}, Chunk ${chunkIndex} -> Tileset ${currentTileset.id}`
    );

    return {
      date,
      hour: hourOfDay,
      tileset: currentTileset.id,
      tilesetHourRange: `${currentTileset.startHour}-${currentTileset.endHour}`
    };
  }, [currentHour]);
};
