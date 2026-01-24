const Booking = require('../models/Booking');
const StationAvailability = require('../models/StationAvailability');

// POST /api/bookings/create - Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const {
      stationId,
      stationName,
      vehicleNumber,
      userName,
      userEmail,
      userPhone,
      bookingDate,
      timeSlot,
      duration,
      bookingType,
      notes
    } = req.body;

    // Validation
    if (!stationId || !stationName || !vehicleNumber || !userName || !userEmail || !userPhone || !bookingDate || !timeSlot || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate booking date is in future
    const bookingDateTime = new Date(bookingDate);
    if (bookingDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Booking date must be in the future'
      });
    }

    // Check station availability
    let stationAvailability = await StationAvailability.findOne({ stationId });
    
    // If station doesn't exist in availability collection, create it
    if (!stationAvailability) {
      // Initialize with default values
      const totalPorts = 10;
      const portDetails = [];
      for (let i = 1; i <= totalPorts; i++) {
        portDetails.push({
          portNumber: i,
          status: 'available',
          connectorType: i % 2 === 0 ? 'CCS' : 'Type 2',
          powerRating: 50
        });
      }
      
      stationAvailability = new StationAvailability({
        stationId,
        stationName,
        totalPorts,
        availablePorts: totalPorts - 2, // Reserve 2 for emergency
        occupiedPorts: 0,
        emergencyPorts: 2,
        portDetails
      });
      await stationAvailability.save();
    }

    const isEmergency = bookingType === 'emergency';

    // Check if ports are available
    if (!stationAvailability.hasAvailablePorts(isEmergency)) {
      return res.status(409).json({
        success: false,
        message: isEmergency ? 'No emergency ports available' : 'No ports available at this station',
        data: {
          availablePorts: stationAvailability.availablePorts,
          emergencyPorts: stationAvailability.emergencyPorts
        }
      });
    }

    // Calculate estimated cost (example: $0.30 per kWh, assuming 50kW charging)
    const estimatedEnergyKwh = duration * 50; // Rough estimate
    const estimatedCost = estimatedEnergyKwh * 0.30;

    // Create booking
    const booking = new Booking({
      stationId,
      stationName,
      vehicleNumber: vehicleNumber.toUpperCase(),
      userName,
      userEmail: userEmail.toLowerCase(),
      userPhone,
      bookingDate: bookingDateTime,
      timeSlot,
      duration,
      portNumber: 0, // Will be assigned when booking port
      status: 'confirmed',
      bookingType: isEmergency ? 'emergency' : 'normal',
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      notes: notes || ''
    });

    await booking.save();

    // Book the port and get port number
    try {
      const assignedPortNumber = stationAvailability.bookPort(booking._id, isEmergency);
      booking.portNumber = assignedPortNumber || 1;
      await booking.save();
      await stationAvailability.save();
    } catch (error) {
      // Rollback booking if port assignment fails
      await Booking.findByIdAndDelete(booking._id);
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId: booking._id,
        stationId: booking.stationId,
        stationName: booking.stationName,
        vehicleNumber: booking.vehicleNumber,
        userName: booking.userName,
        bookingDate: booking.bookingDate,
        timeSlot: booking.timeSlot,
        duration: booking.duration,
        portNumber: booking.portNumber,
        status: booking.status,
        bookingType: booking.bookingType,
        estimatedCost: booking.estimatedCost,
        availablePortsRemaining: stationAvailability.availablePorts,
        emergencyPortsRemaining: stationAvailability.emergencyPorts
      }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};

// GET /api/bookings/station/:stationId - Get all bookings for a station
exports.getStationBookings = async (req, res) => {
  try {
    const { stationId } = req.params;
    const { status, startDate, endDate } = req.query;

    const query = { stationId };
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.bookingDate = {};
      if (startDate) query.bookingDate.$gte = new Date(startDate);
      if (endDate) query.bookingDate.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(query).sort({ bookingDate: -1 });

    res.json({
      success: true,
      stationId,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching station bookings',
      error: error.message
    });
  }
};

// GET /api/bookings/availability/:stationId - Get station port availability
exports.getStationAvailability = async (req, res) => {
  try {
    const { stationId } = req.params;

    let availability = await StationAvailability.findOne({ stationId });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Station availability not found'
      });
    }

    res.json({
      success: true,
      data: {
        stationId: availability.stationId,
        stationName: availability.stationName,
        totalPorts: availability.totalPorts,
        availablePorts: availability.availablePorts,
        occupiedPorts: availability.occupiedPorts,
        emergencyPorts: availability.emergencyPorts,
        utilizationRate: Math.round((availability.occupiedPorts / availability.totalPorts) * 100),
        portDetails: availability.portDetails,
        lastUpdated: availability.lastUpdated
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching station availability',
      error: error.message
    });
  }
};

// GET /api/bookings/:bookingId - Get booking details
exports.getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching booking details',
      error: error.message
    });
  }
};

// PUT /api/bookings/:bookingId/cancel - Cancel a booking
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking with status: ${booking.status}`
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    await booking.save();

    // Release the port
    const stationAvailability = await StationAvailability.findOne({ stationId: booking.stationId });
    if (stationAvailability) {
      const wasEmergency = booking.bookingType === 'emergency';
      stationAvailability.releasePort(booking.portNumber, wasEmergency);
      await stationAvailability.save();
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        bookingId: booking._id,
        status: booking.status,
        availablePortsNow: stationAvailability ? stationAvailability.availablePorts : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};

// PUT /api/bookings/:bookingId/complete - Mark booking as completed
exports.completeBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { energyDelivered, actualCost } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update booking
    booking.status = 'completed';
    if (energyDelivered) booking.energyDelivered = energyDelivered;
    if (actualCost) booking.actualCost = actualCost;
    await booking.save();

    // Release the port
    const stationAvailability = await StationAvailability.findOne({ stationId: booking.stationId });
    if (stationAvailability) {
      const wasEmergency = booking.bookingType === 'emergency';
      stationAvailability.releasePort(booking.portNumber, wasEmergency);
      await stationAvailability.save();
    }

    res.json({
      success: true,
      message: 'Booking completed successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing booking',
      error: error.message
    });
  }
};

// GET /api/bookings/user/:userEmail - Get user's bookings
exports.getUserBookings = async (req, res) => {
  try {
    const { userEmail } = req.params;

    const bookings = await Booking.find({ 
      userEmail: userEmail.toLowerCase() 
    }).sort({ bookingDate: -1 });

    res.json({
      success: true,
      userEmail,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user bookings',
      error: error.message
    });
  }
};

module.exports = exports;
