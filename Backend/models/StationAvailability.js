const mongoose = require('mongoose');

const stationAvailabilitySchema = new mongoose.Schema({
  stationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  stationName: {
    type: String,
    required: true
  },
  totalPorts: {
    type: Number,
    required: true,
    min: 1
  },
  availablePorts: {
    type: Number,
    required: true,
    min: 0
  },
  occupiedPorts: {
    type: Number,
    default: 0,
    min: 0
  },
  emergencyPorts: {
    type: Number,
    default: 2,
    min: 0
  },
  portDetails: [{
    portNumber: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance', 'reserved'],
      default: 'available'
    },
    connectorType: {
      type: String,
      enum: ['Type 2', 'CCS', 'CHAdeMO', 'Type 1'],
      default: 'Type 2'
    },
    powerRating: {
      type: Number, // in kW
      default: 50
    },
    currentBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to check if ports are available
stationAvailabilitySchema.methods.hasAvailablePorts = function(isEmergency = false) {
  if (isEmergency) {
    return this.emergencyPorts > 0;
  }
  return this.availablePorts > 0;
};

// Method to book a port
stationAvailabilitySchema.methods.bookPort = function(bookingId, isEmergency = false) {
  if (isEmergency) {
    if (this.emergencyPorts <= 0) {
      throw new Error('No emergency ports available');
    }
    this.emergencyPorts -= 1;
  } else {
    if (this.availablePorts <= 0) {
      throw new Error('No ports available');
    }
    this.availablePorts -= 1;
    this.occupiedPorts += 1;
  }
  
  // Find and update an available port
  const availablePort = this.portDetails.find(p => p.status === 'available');
  if (availablePort) {
    availablePort.status = 'occupied';
    availablePort.currentBookingId = bookingId;
  }
  
  this.lastUpdated = new Date();
  return availablePort ? availablePort.portNumber : null;
};

// Method to release a port
stationAvailabilitySchema.methods.releasePort = function(portNumber, wasEmergency = false) {
  if (wasEmergency) {
    this.emergencyPorts += 1;
  } else {
    this.availablePorts += 1;
    this.occupiedPorts = Math.max(0, this.occupiedPorts - 1);
  }
  
  // Update port status
  const port = this.portDetails.find(p => p.portNumber === portNumber);
  if (port) {
    port.status = 'available';
    port.currentBookingId = null;
  }
  
  this.lastUpdated = new Date();
};

module.exports = mongoose.model('StationAvailability', stationAvailabilitySchema);
