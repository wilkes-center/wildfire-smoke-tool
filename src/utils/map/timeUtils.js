import { logger } from '../logger';

/**
 * Formats a timestamp into a readable date-time string
 * @param {Object} timestamp - Object containing date and hour properties
 * @returns {string} Formatted date string
 */
export const formatDateTime = timestamp => {
  if (!timestamp || !timestamp.date) return '';

  // Convert to Date object, handling both date string and Date objects
  const dateStr =
    typeof timestamp.date === 'string'
      ? timestamp.date
      : timestamp.date.toISOString().split('T')[0];

  // Parse the date string in UTC to avoid timezone shifts
  const [year, month, day] = dateStr.split('-').map(Number);

  // Create a date using UTC values to prevent timezone conversion issues
  const dateOptions = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' };
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const formattedDate = utcDate.toLocaleDateString('en-US', dateOptions);

  logger.debug(`Formatting date: ${timestamp.date}, hour: ${timestamp.hour} -> ${formattedDate}`);

  return formattedDate;
};

/**
 * Converts UTC time to user's local time and formats it
 * @param {Object} timestamp - Object containing date and hour properties
 * @returns {Object} Object with formatted date, time, and timezone info
 */
export const formatLocalDateTime = timestamp => {
  if (!timestamp || !timestamp.date || timestamp.hour === undefined) {
    logger.warn('Invalid timestamp provided to formatLocalDateTime', { timestamp });
    return { time: 'Invalid', timezone: '', date: 'Invalid' };
  }

  try {
    const { date, hour } = timestamp;
    const dateObj = new Date(`${date}T${hour.toString().padStart(2, '0')}:00:00Z`);

    const formattedDate = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });

    logger.debug('Formatting date', {
      inputDate: timestamp.date,
      inputHour: timestamp.hour,
      formattedDate
    });

    return {
      time: `${hour.toString().padStart(2, '0')}:00`,
      timezone: 'UTC',
      date: formattedDate
    };
  } catch (error) {
    logger.error('Error formatting local date time', {
      error: error.message,
      timestamp
    });
    return { time: 'Error', timezone: '', date: 'Error' };
  }
};

/**
 * Gets the user's timezone information
 * @returns {Object} Timezone information
 */
export const getUserTimezone = () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const utcOffset = -now.getTimezoneOffset() / 60; // Convert minutes to hours
  const offsetString = utcOffset >= 0 ? `+${utcOffset}` : `${utcOffset}`;

  return {
    timezone,
    utcOffset,
    offsetString,
    isUTC: utcOffset === 0
  };
};

/**
 * Checks if the user's local time differs from UTC for a given timestamp
 * @param {Object} timestamp - Object containing date and hour properties
 * @returns {boolean} True if local time differs from UTC
 */
export const isLocalTimeDifferentFromUTC = timestamp => {
  if (!timestamp || !timestamp.date) return false;

  const dateStr =
    typeof timestamp.date === 'string'
      ? timestamp.date
      : timestamp.date.toISOString().split('T')[0];

  const [year, month, day] = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, timestamp.hour, 0, 0, 0));

  // Compare UTC hour with local hour
  const utcHour = utcDate.getUTCHours();
  const localHour = utcDate.getHours();
  const utcDay = utcDate.getUTCDate();
  const localDay = utcDate.getDate();

  return utcHour !== localHour || utcDay !== localDay;
};

/**
 * Calculates the current timeline hour based on user's current time
 * @param {Date} startDate - The start date of the timeline (from constants)
 * @param {number} totalHours - Total hours in the timeline (from constants)
 * @returns {number} The current hour index in the timeline (0-based)
 */
export const getCurrentTimelineHour = (startDate, totalHours) => {
  try {
    const now = new Date();
    const currentUTC = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), 0, 0, 0)
    );

    // Calculate hours since timeline start
    const hoursSinceStart = Math.floor((currentUTC - startDate) / (1000 * 60 * 60));

    logger.debug('Timeline calculation', {
      now: now.toISOString(),
      currentUTC: currentUTC.toISOString(),
      startDate: startDate.toISOString(),
      hoursSinceStart,
      totalHours
    });

    // Clamp to valid range
    if (hoursSinceStart < 0) {
      logger.debug('Current time is before timeline start, using hour 0');
      return 0;
    }

    if (hoursSinceStart >= totalHours) {
      logger.debug('Current time is after timeline end, using last hour');
      return totalHours - 1;
    }

    logger.debug('Setting initial timeline hour', { hoursSinceStart });
    return hoursSinceStart;
  } catch (error) {
    logger.error('Error calculating current timeline hour', {
      error: error.message,
      startDate: startDate?.toISOString(),
      totalHours
    });
    return 0;
  }
};
