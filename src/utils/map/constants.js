const getCurrentUTCDate = () => {
    const now = new Date();
    return new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0, 0
    ));
};
  
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

const formatDate = (date) => {
    return date.toISOString().split('T')[0].replace(/-/g, '');
};

const generateTilesetInfo = (date) => {
    const formattedDate = formatDate(date);
    const chunks = [
      { start: 0, end: 3 },
      { start: 3, end: 6 },
      { start: 6, end: 9 },
      { start: 9, end: 12 },
      { start: 12, end: 15 },
      { start: 15, end: 18 },
      { start: 18, end: 21 },
      { start: 21, end: 24 }
    ];
  
    return chunks.map(({ start, end }) => {
      const startPadded = String(start).padStart(2, '0');
      const endPadded = String(end).padStart(2, '0');
      
      return {
        // Tileset ID uses hyphens
        id: `pkulandh.pm25-${formattedDate}-${startPadded}to${endPadded}`,
        // Layer name uses underscores
        layer: `pm25_${formattedDate}_${startPadded}to${endPadded}`,
        date: date.toISOString().split('T')[0],
        startHour: start,
        endHour: end
      };
    });
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

export const PM25_LEVELS = [
    { value: 0, label: 'Good', color: 'bg-green-500', text: 'text-green-700' },
    { value: 12, label: 'Moderate', color: 'bg-yellow-500', text: 'text-yellow-700' },
    { value: 35.5, label: 'Unhealthy for Sensitive Groups', color: 'bg-orange-500', text: 'text-orange-700' },
    { value: 55.5, label: 'Unhealthy', color: 'bg-red-500', text: 'text-red-700' },
    { value: 150.5, label: 'Very Unhealthy', color: 'bg-purple-500', text: 'text-purple-700' },
    { value: 250.5, label: 'Hazardous', color: 'bg-rose-500', text: 'text-rose-700' }
];