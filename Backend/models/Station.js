const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  stationId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: {
    type: String,
    required: true
  },
  capacity: {
    type: Number, // in kW
    required: true
  },
  status: {
    type: String,
    enum: ['safe', 'warning', 'critical', 'offline'],
    default: 'safe'
  },
  metadata: {
    rating: String,      // e.g., "2500 kVA"
    assetId: String,     // e.g., "TX-2049-NYC"
    installDate: Date,
    manufacturer: String,
    model: String
  },
  operationalLimits: {
    maxTemperature: {
      type: Number,
      default: 110
    },
    warningTemperature: {
      type: Number,
      default: 85
    },
    maxLoad: {
      type: Number,
      default: 100
    },
    warningLoad: {
      type: Number,
      default: 70
    }
  }
}, {
  timestamps: true
});

// Geospatial index for location-based queries
stationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Station', stationSchema);
