const mongoose = require('mongoose');

const chargingSessionSchema = new mongoose.Schema({
  vehicleId: {
    type: String,
    required: true,
    index: true
  },
  stationId: {
    type: Number,
    required: true,
    index: true
  },
  requestTime: {
    type: Date,
    default: Date.now,
    required: true
  },
  requiredKwh: {
    type: Number,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  maxDelayMinutes: {
    type: Number,
    default: 60,
    min: 0
  },
  batteryLevel: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  region: {
    type: String,
    required: true,
    index: true
  },
  priority: {
    type: Boolean,
    default: false
  },
  scheduledStart: {
    type: Date,
    required: true,
    index: true
  },
  chargingRate: {
    type: String,
    enum: ['fast', 'slow'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'charging', 'waiting', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  reason: {
    type: String
  },
  estimatedDuration: {
    type: Number // in minutes
  },
  gridSafe: {
    type: Boolean,
    default: true
  },
  actualDelayMinutes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
chargingSessionSchema.index({ stationId: 1, scheduledStart: 1 });
chargingSessionSchema.index({ vehicleId: 1, status: 1 });
chargingSessionSchema.index({ status: 1, scheduledStart: 1 });

module.exports = mongoose.model('ChargingSession', chargingSessionSchema);
