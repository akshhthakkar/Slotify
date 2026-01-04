const mongoose = require("mongoose");

/**
 * Shared working hours schema used by Business and Staff models
 */
const workingHoursSchema = new mongoose.Schema(
  {
    isOpen: {
      type: Boolean,
      default: false,
    },
    slots: [
      {
        start: {
          type: String,
          match: [
            /^([01]\d|2[0-3]):([0-5]\d)$/,
            "Invalid time format. Use HH:MM",
          ],
        },
        end: {
          type: String,
          match: [
            /^([01]\d|2[0-3]):([0-5]\d)$/,
            "Invalid time format. Use HH:MM",
          ],
        },
      },
    ],
    breaks: [
      {
        start: String,
        end: String,
      },
    ],
  },
  { _id: false }
);

module.exports = { workingHoursSchema };
