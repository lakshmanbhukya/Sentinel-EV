const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  stationId: {
    type: Number,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['temperature', 'load', 'grid', 'equipment', 'system'],
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  value: {
    type: Number
  },
  threshold: {
    type: Number
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved'],
    default: 'active',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  acknowledgedAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Compound indexes
alertSchema.index({ status: 1, severity: 1, createdAt: -1 });
alertSchema.index({ stationId: 1, status: 1 });

module.exports = mongoose.model('Alert', alertSchema);
