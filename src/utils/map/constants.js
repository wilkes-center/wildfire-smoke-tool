import { PM25_LEVELS } from '../../constants/pm25Levels';

const getCurrentUTCDate = () => {
  // Get current UTC date directly to avoid timezone issues
  const now = new Date();

  // Create date object for today at UTC midnight using UTC methods
  console.log("Using date as 'today':", now);
  console.log('UTC date components:', {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth(),
    date: now.getUTCDate()
  });

  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
};

// Calculate a range of dates for today and tomorrow only
const getDateRange = () => {
  const today = getCurrentUTCDate();

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const endDate = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000 - 1);

  console.log('Date range:', {
    today: today.toISOString().split('T')[0],
    tomorrow: tomorrow.toISOString().split('T')[0],
    totalHours: Math.floor((endDate - today) / (1000 * 60 * 60))
  });

  return {
    today,
    tomorrow,
    startDate: today,
    endDate,
    totalHours: Math.floor((endDate - today) / (1000 * 60 * 60))
  };
};

// Format a date to YYYYMMDD format
const formatDate = date => {
  return date.toISOString().split('T')[0].replace(/-/g, '');
};

// Generate tileset info for a specific date
const generateTilesetInfo = date => {
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

const { startDate, endDate, totalHours, today, tomorrow } = getDateRange();

export const START_DATE = startDate;
export const END_DATE = endDate;
export const TOTAL_HOURS = totalHours;

export const TILESET_INFO = [...generateTilesetInfo(today), ...generateTilesetInfo(tomorrow)];

export { PM25_LEVELS };
