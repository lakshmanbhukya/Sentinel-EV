const mongoose = require('mongoose');

const gridStatusSchema = new mongoose.Schema({
  region: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  currentLoadKW: {
    type: Number,
    required: true,
    min: 0
  },
  maxSafeLoadKW: {
    type: Number,
    required: true,
    min: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
gridStatusSchema.index({ region: 1, updatedAt: -1 });

module.exports = mongoose.model('GridStatus', gridStatusSchema);
