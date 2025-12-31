const mongoose = require('mongoose');

const workingHoursSchema = new mongoose.Schema({
  isOpen: {
    type: Boolean,
    default: false
  },
  slots: [{
    start: {
      type: String,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:MM']
    },
    end: {
      type: String,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:MM']
    }
  }],
  breaks: [{
    start: String,
    end: String
  }]
}, { _id: false });

const staffSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: [true, 'Business ID is required'],
    index: true
  },
  specialization: {
    type: String,
    trim: true
  },
  workingHours: {
    monday: workingHoursSchema,
    tuesday: workingHoursSchema,
    wednesday: workingHoursSchema,
    thursday: workingHoursSchema,
    friday: workingHoursSchema,
    saturday: workingHoursSchema,
    sunday: workingHoursSchema
  },
  serviceIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  unavailableDates: [{
    date: {
      type: Date,
      required: true
    },
    reason: String
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes
staffSchema.index({ businessId: 1, isActive: 1 });
staffSchema.index({ userId: 1, businessId: 1 });

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;