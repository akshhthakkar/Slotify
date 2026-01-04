const mongoose = require("mongoose");
const { workingHoursSchema } = require("./schemas/workingHours");

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Staff name is required"],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Optional - only for staff with login access
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business ID is required"],
      index: true,
    },
    specialization: {
      type: String,
      trim: true,
    },
    workingHours: {
      monday: workingHoursSchema,
      tuesday: workingHoursSchema,
      wednesday: workingHoursSchema,
      thursday: workingHoursSchema,
      friday: workingHoursSchema,
      saturday: workingHoursSchema,
      sunday: workingHoursSchema,
    },
    serviceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    unavailableDates: [
      {
        date: {
          type: Date,
          required: true,
        },
        reason: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
staffSchema.index({ businessId: 1, isActive: 1 });
staffSchema.index({ userId: 1, businessId: 1 });

const Staff = mongoose.model("Staff", staffSchema);

module.exports = Staff;
