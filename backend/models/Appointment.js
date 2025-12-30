const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: [true, 'Business ID is required'],
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required'],
    index: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service ID is required']
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Staff ID is required'],
    index: true
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required'],
    index: true
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:MM']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:MM']
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show', 'rescheduled'],
    default: 'scheduled',
    index: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  cancellationReason: String,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationFeeApplied: {
    type: Boolean,
    default: false
  },
  isRescheduled: {
    type: Boolean,
    default: false
  },
  rescheduledFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  rescheduledTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  rescheduledAt: Date,
  rescheduleCount: {
    type: Number,
    default: 0
  },
  reminderSent: {
    day: {
      type: Boolean,
      default: false
    },
    hours: {
      type: Boolean,
      default: false
    }
  },
  createdBy: {
    type: String,
    enum: ['customer', 'admin', 'staff'],
    default: 'customer'
  }
}, {
  timestamps: true
});

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
      status: { $in: ['scheduled'] } // Only enforce for scheduled appointments
    }
  }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;