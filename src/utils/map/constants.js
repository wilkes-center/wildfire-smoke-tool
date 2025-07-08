import { PM25_LEVELS } from '../../constants/pm25Levels';

// Check if current time is before 1:30 PM MDT (data update time)
const isBeforeMDTDataUpdate = () => {
  const now = new Date();

  // Convert current time to MDT (UTC-6)
  // Note: MDT is UTC-6, but we need to account for the actual timezone
  // We'll create a date object for today at 1:30 PM MDT
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1:30 PM MDT = 19:30 UTC (13:30 + 6 hours)
  const mdtUpdateTime = new Date(today.getTime());
  mdtUpdateTime.setUTCHours(19, 30, 0, 0); // 19:30 UTC = 1:30 PM MDT

  const isBeforeUpdate = now < mdtUpdateTime;

  console.log('MDT data update check:', {
    currentTime: now.toISOString(),
    mdtUpdateTime: mdtUpdateTime.toISOString(),
    isBeforeUpdate,
    currentUTCHour: now.getUTCHours(),
    currentUTCMinutes: now.getUTCMinutes()
  });

  return isBeforeUpdate;
};

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

// Calculate date range based on MDT data availability
const getDateRange = () => {
  const today = getCurrentUTCDate();
  const beforeDataUpdate = isBeforeMDTDataUpdate();

  let startDate, endDate;

  if (beforeDataUpdate) {
    // Before 1:30 PM MDT: show yesterday and today
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    startDate = yesterday;
    endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);

    console.log('Before MDT data update - showing yesterday and today:', {
      yesterday: yesterday.toISOString().split('T')[0],
      today: today.toISOString().split('T')[0],
      totalHours: 48
    });
  } else {
    // After 1:30 PM MDT: show today and tomorrow
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    startDate = today;
    endDate = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000 - 1);

    console.log('After MDT data update - showing today and tomorrow:', {
      today: today.toISOString().split('T')[0],
      tomorrow: tomorrow.toISOString().split('T')[0],
      totalHours: 48
    });
  }

  return {
    startDate,
    endDate,
    totalHours: 48,
    isShowingPreviousDays: beforeDataUpdate
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
    { name: '00to08', start: 0, end: 7, index: 0 },
    { name: '08to16', start: 8, end: 15, index: 1 },
    { name: '16to24', start: 16, end: 23, index: 2 }
  ];

  // Debug log to track date conversions
  console.log(`Generating tileset info for date: ${date} -> ${formattedDate}`);

  return chunks.map(({ name, start, end, index }) => ({
    id: `pkulandh.pm25-${formattedDate}-${index}`,
    layer: `${formattedDate}_${index}`,
    date: date.toISOString().split('T')[0],
    startHour: start,
    endHour: end
  }));
};

export const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const { startDate, endDate, totalHours, isShowingPreviousDays } = getDateRange();

export const START_DATE = startDate;
export const END_DATE = endDate;
export const TOTAL_HOURS = totalHours;
export const IS_SHOWING_PREVIOUS_DAYS = isShowingPreviousDays;

// Generate tileset info for the appropriate date range
const generateDateRange = () => {
  const dates = [];
  const currentDate = new Date(startDate);

  // Generate 2 consecutive days starting from startDate
  for (let i = 0; i < 2; i++) {
    dates.push(new Date(currentDate));
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return dates;
};

const dateRange = generateDateRange();
export const TILESET_INFO = dateRange.flatMap(date => generateTilesetInfo(date));

export { PM25_LEVELS };
