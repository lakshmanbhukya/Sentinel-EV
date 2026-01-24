const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  stationId: {
    type: String,
    required: true,
    index: true
  },
  stationName: {
    type: String,
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  userPhone: {
    type: String,
    required: true,
    trim: true
  },
  bookingDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in hours
    required: true,
    min: 0.5,
    max: 8
  },
  portNumber: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'confirmed'
  },
  bookingType: {
    type: String,
    enum: ['normal', 'emergency'],
    default: 'normal'
  },
  estimatedCost: {
    type: Number,
    default: 0
  },
  actualCost: {
    type: Number,
    default: 0
  },
  energyDelivered: {
    type: Number, // in kWh
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
bookingSchema.index({ stationId: 1, bookingDate: 1 });
bookingSchema.index({ vehicleNumber: 1 });
bookingSchema.index({ userEmail: 1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
