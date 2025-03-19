import { PM25_LEVELS } from '../../constants/pm25Levels';

const getCurrentUTCDate = () => {
    const now = new Date();
    return new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0, 0
    ));
  };
  
  // Calculate a range of dates centered around today (2 days before, today, and 1 day after)
  const getDateRange = () => {
    const today = getCurrentUTCDate();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dayBefore = new Date(today);
    dayBefore.setDate(dayBefore.getDate() - 2);
  
    const endDate = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    return {
      today,
      tomorrow,
      yesterday,
      dayBefore,
      startDate: dayBefore,
      endDate,
      totalHours: Math.floor((endDate - dayBefore) / (1000 * 60 * 60))
    };
  };
  
  // Format a date to YYYYMMDD format
  const formatDate = (date) => {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  };
  
  // Generate tileset info for a specific date
  const generateTilesetInfo = (date) => {
    const formattedDate = formatDate(date);
    const chunks = [
      { name: '00to02', start: 0, end: 1 },
      { name: '02to04', start: 2, end: 3 },
      { name: '04to06', start: 4, end: 5 },
      { name: '06to08', start: 6, end: 7 },
      { name: '08to10', start: 8, end: 9 },
      { name: '10to12', start: 10, end: 11 },
      { name: '12to14', start: 12, end: 13 },
      { name: '14to16', start: 14, end: 15 },
      { name: '16to18', start: 16, end: 17 },
      { name: '18to20', start: 18, end: 19 },
      { name: '20to22', start: 20, end: 21 },
      { name: '22to24', start: 22, end: 23 }
    ];
    
    return chunks.map(({ name, start, end }) => ({
      id: `pkulandh.pm25-${formattedDate}-${name}`,
      layer: `pm25_${formattedDate}_${name}`,
      date: date.toISOString().split('T')[0],
      startHour: start,
      endHour: end
    }));
  };
  
  export const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
  
  const { startDate, endDate, totalHours, dayBefore, yesterday, today, tomorrow } = getDateRange();
  
  export const START_DATE = startDate;
  export const END_DATE = endDate;
  export const TOTAL_HOURS = totalHours;
  
  export const TILESET_INFO = [
    ...generateTilesetInfo(dayBefore),
    ...generateTilesetInfo(yesterday),
    ...generateTilesetInfo(today),
    ...generateTilesetInfo(tomorrow)
  ];
  

  export { PM25_LEVELS };