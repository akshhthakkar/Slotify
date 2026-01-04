const mongoose = require("mongoose");
const {
  APPOINTMENT_STATUS,
  getAllStatuses,
} = require("../constants/appointmentStatus");

const appointmentSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business ID is required"],
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Service ID is required"],
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      index: true,
    },
    appointmentDate: {
      type: Date,
      required: [true, "Appointment date is required"],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:MM"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:MM"],
    },
    status: {
      type: String,
      enum: getAllStatuses(),
      default: APPOINTMENT_STATUS.SCHEDULED,
      index: true,
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    cancellationReason: String,
    cancelledAt: Date,
    cancelledBy: {
      type: String,
      enum: ["customer", "admin", "staff", "system"],
    },
    cancellationFeeApplied: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
    completedBy: {
      type: String,
      enum: ["customer", "admin", "staff", "system"],
    },
    isRescheduled: {
      type: Boolean,
      default: false,
    },
    rescheduledFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    rescheduledTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    rescheduledAt: Date,
    rescheduleCount: {
      type: Number,
      default: 0,
    },
    reminderSent: {
      day: {
        type: Boolean,
        default: false,
      },
      hours: {
        type: Boolean,
        default: false,
      },
    },
    createdBy: {
      type: String,
      enum: ["customer", "admin", "staff"],
      default: "customer",
    },
    isWalkIn: {
      type: Boolean,
      default: false,
    },
    walkInNotes: {
      type: String,
    },
    // Audit log for tracking actions
    actionLog: [
      {
        action: {
          type: String,
          enum: ["created", "completed", "cancelled", "no-show", "rescheduled"],
          required: true,
        },
        performedBy: {
          type: String,
          enum: ["customer", "admin", "staff", "system"],
          required: true,
        },
        performedAt: {
          type: Date,
          default: Date.now,
        },
        reason: String,
        metadata: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performance and preventing double-booking
appointmentSchema.index({ businessId: 1, appointmentDate: 1 });
appointmentSchema.index({ businessId: 1, staffId: 1, appointmentDate: 1 });
appointmentSchema.index({ customerId: 1, status: 1 });

// Unique index to prevent double-booking (same staff, date, and time)
appointmentSchema.index(
  { businessId: 1, staffId: 1, appointmentDate: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["scheduled"] }, // Only enforce for scheduled appointments
    },
  }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
