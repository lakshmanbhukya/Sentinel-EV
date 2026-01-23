const mongoose = require('mongoose');

const stationTelemetrySchema = new mongoose.Schema({
  stationId: {
    type: Number,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  temperature: {
    type: Number,
    required: true,
    min: 0,
    max: 150
  },
  load: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  powerKW: {
    type: Number,
    required: true,
    min: 0
  },
  voltage: {
    type: Number,
    min: 0
  },
  current: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['safe', 'warning', 'critical'],
    required: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
stationTelemetrySchema.index({ stationId: 1, timestamp: -1 });
stationTelemetrySchema.index({ status: 1, timestamp: -1 });

// TTL index - automatically delete records older than 90 days
stationTelemetrySchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('StationTelemetry', stationTelemetrySchema);
