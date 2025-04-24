/**
 * Formats a timestamp into a readable date-time string
 * @param {Object} timestamp - Object containing date and hour properties
 * @returns {string} Formatted date string
 */
export const formatDateTime = (timestamp) => {
  if (!timestamp || !timestamp.date) return '';
  
  // Convert to Date object, handling both date string and Date objects
  const dateStr = typeof timestamp.date === 'string' 
    ? timestamp.date 
    : timestamp.date.toISOString().split('T')[0];
    
  // Parse the date string in UTC to avoid timezone shifts
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Create a date using UTC values to prevent timezone conversion issues
  const dateOptions = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' };
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const formattedDate = utcDate.toLocaleDateString('en-US', dateOptions);
  
  console.log(`Formatting date: ${timestamp.date}, hour: ${timestamp.hour} -> ${formattedDate}`);
  
  return formattedDate;
}; 