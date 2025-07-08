import { formatLocalDateTime, getCurrentTimelineHour } from './timeUtils';

/**
 * Simple test function to verify current time calculation
 */
export const testCurrentTimeCalculation = () => {
  console.log('=== Testing Current Time Calculation ===');

  // Test with a known start date
  const testStartDate = new Date('2024-01-01T00:00:00Z');
  const totalHours = 48; // 2 days

  // Test current time calculation
  const currentHour = getCurrentTimelineHour(testStartDate, totalHours);
  console.log(`Current timeline hour: ${currentHour}`);

  // Test local time formatting
  const testTimestamp = { date: '2024-01-01', hour: 12 };
  const localTime = formatLocalDateTime(testTimestamp);
  console.log('Local time formatting test:', localTime);

  // Test edge cases
  console.log('=== Edge Case Tests ===');

  // Test with start date in the future
  const futureStartDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
  const futureHour = getCurrentTimelineHour(futureStartDate, totalHours);
  console.log(`Future start date hour (should be 0): ${futureHour}`);

  // Test with start date in the past beyond timeline
  const pastStartDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 2 days ago
  const pastHour = getCurrentTimelineHour(pastStartDate, totalHours);
  console.log(`Past start date hour (should be ${totalHours - 1}): ${pastHour}`);

  console.log('=== Test Complete ===');

  return {
    currentHour,
    localTime,
    futureHour,
    pastHour
  };
};

// Run test if this file is imported
if (typeof window !== 'undefined') {
  // Only run in browser environment
  setTimeout(() => {
    testCurrentTimeCalculation();
  }, 1000);
}
