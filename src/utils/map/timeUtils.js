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

  console.log(`Formatting date: ${timestamp.date}, hour: ${timestamp.hour} -> ${formattedDate}`);

  return formattedDate;
};

/**
 * Converts UTC time to user's local time and formats it
 * @param {Object} timestamp - Object containing date and hour properties
 * @returns {Object} Object with formatted date, time, and timezone info
 */
export const formatLocalDateTime = timestamp => {
  if (!timestamp || !timestamp.date) return { date: '', time: '', timezone: '' };

  // Convert to Date object, handling both date string and Date objects
  const dateStr =
    typeof timestamp.date === 'string'
      ? timestamp.date
      : timestamp.date.toISOString().split('T')[0];

  // Parse the date string and hour as UTC
  const [year, month, day] = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, timestamp.hour, 0, 0, 0));

  // Format in user's local timezone
  const localDate = utcDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const localTime = utcDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // Get timezone abbreviation
  const timezone = utcDate
    .toLocaleTimeString('en-US', {
      timeZoneName: 'short'
    })
    .split(' ')
    .pop();

  console.log(
    `Converting UTC ${timestamp.date} ${timestamp.hour}:00 -> Local ${localDate} ${localTime} ${timezone}`
  );

  return {
    date: localDate,
    time: localTime,
    timezone,
    fullDateTime: utcDate
  };
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
 * Check if current time is before 1:30 PM MDT (data update time)
 * @returns {boolean} True if before MDT data update time
 */
export const isBeforeMDTDataUpdate = () => {
  const now = new Date();

  // Convert current time to MDT (UTC-6)
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

/**
 * Calculates the current timeline hour based on user's current time and data availability
 * @param {Date} startDate - The start date of the timeline (from constants)
 * @param {number} totalHours - Total hours in the timeline (from constants)
 * @returns {number} The current hour index in the timeline (0-based)
 */
export const getCurrentTimelineHour = (startDate, totalHours) => {
  const now = new Date();
  const currentUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), 0, 0, 0)
  );

  // Calculate hours since timeline start
  const hoursSinceStart = Math.floor((currentUTC - startDate) / (1000 * 60 * 60));

  console.log('Timeline calculation:', {
    now: now.toISOString(),
    currentUTC: currentUTC.toISOString(),
    startDate: startDate.toISOString(),
    hoursSinceStart,
    totalHours,
    isBeforeMDTUpdate: isBeforeMDTDataUpdate()
  });

  // Always calculate the actual current time position within the timeline
  // Clamp to valid range
  if (hoursSinceStart < 0) {
    console.log('Current time is before timeline start, using hour 0');
    return 0;
  }

  if (hoursSinceStart >= totalHours) {
    console.log('Current time is after timeline end, using last hour');
    return totalHours - 1;
  }

  console.log(`Setting initial timeline hour to: ${hoursSinceStart}`);
  return hoursSinceStart;
};
