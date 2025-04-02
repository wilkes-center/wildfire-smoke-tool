/**
 * Formats a timestamp into a readable date-time string
 * @param {Object} timestamp - Object containing date and hour properties
 * @returns {string} Formatted date string
 */
export const formatDateTime = (timestamp) => {
  if (!timestamp || !timestamp.date) return '';
  
  const date = new Date(timestamp.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  return formattedDate;
}; 