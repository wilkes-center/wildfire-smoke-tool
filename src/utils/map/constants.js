import { PM25_LEVELS } from '../../constants/pm25Levels';

const getCurrentUTCDate = () => {
    // Get current date and use it directly
    const now = new Date();
    
    // Create date object for today at UTC midnight
    console.log("Using date as 'today':", now);
    
    return new Date(Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0, 0, 0, 0
    ));
  };
  
  // Calculate a range of dates for day before yesterday, yesterday, today, and tomorrow
  const getDateRange = () => {
    const today = getCurrentUTCDate();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
  
    const endDate = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    console.log("Date range:", {
      dayBeforeYesterday: dayBeforeYesterday.toISOString().split('T')[0],
      yesterday: yesterday.toISOString().split('T')[0],
      today: today.toISOString().split('T')[0],
      tomorrow: tomorrow.toISOString().split('T')[0],
      totalHours: Math.floor((endDate - dayBeforeYesterday) / (1000 * 60 * 60))
    });
    
    return {
      today,
      tomorrow,
      yesterday,
      dayBeforeYesterday,
      startDate: dayBeforeYesterday,
      endDate,
      totalHours: Math.floor((endDate - dayBeforeYesterday) / (1000 * 60 * 60))
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
      { name: '00to12', start: 0, end: 11, index: 0 },
      { name: '12to24', start: 12, end: 23, index: 1 }
    ];
    
    // Debug log to track date conversions
    console.log(`Generating tileset info for date: ${date} -> ${formattedDate}`);
    
    return chunks.map(({ name, start, end, index }) => ({
      id: `pkulandh.pm25_${formattedDate}${index}`,
      layer: `pm25_${formattedDate}${index}`,
      date: date.toISOString().split('T')[0],
      startHour: start,
      endHour: end
    }));
  };
  
  export const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
  
  const { startDate, endDate, totalHours, dayBeforeYesterday, yesterday, today, tomorrow } = getDateRange();
  
  export const START_DATE = startDate;
  export const END_DATE = endDate;
  export const TOTAL_HOURS = totalHours;
  
  export const TILESET_INFO = [
    ...generateTilesetInfo(dayBeforeYesterday),
    ...generateTilesetInfo(yesterday),
    ...generateTilesetInfo(today),
    ...generateTilesetInfo(tomorrow)
  ];
  

  export { PM25_LEVELS };