const mongoose = require('mongoose');

const powerUsageLogSchema = new mongoose.Schema({
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
  powerKW: {
    type: Number,
    required: true
  },
  activePorts: {
    type: Number,
    default: 0
  },
  region: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
powerUsageLogSchema.index({ stationId: 1, timestamp: 1 });
powerUsageLogSchema.index({ region: 1, timestamp: 1 });

module.exports = mongoose.model('PowerUsageLog', powerUsageLogSchema);
