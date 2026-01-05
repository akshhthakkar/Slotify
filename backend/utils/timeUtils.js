/**
 * Time Utilities
 * Helper functions for timezone-safe date operations.
 */

/**
 * Get current time in a specific timezone
 * @param {String} timeZone - Timezone string (e.g., 'Asia/Kolkata', 'UTC')
 * @returns {Date} Date object representing "now" in the target timezone
 */
const getNowInBusinessTZ = (timeZone = "UTC") => {
  try {
    // Create date from current time locale string in target timezone
    return new Date(new Date().toLocaleString("en-US", { timeZone }));
  } catch (error) {
    console.error(`Invalid timezone: ${timeZone}, falling back to UTC`);
    return new Date(new Date().toLocaleString("en-US", { timeZone: "UTC" }));
  }
};

module.exports = { getNowInBusinessTZ };
