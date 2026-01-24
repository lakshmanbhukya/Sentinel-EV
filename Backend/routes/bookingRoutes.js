const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// POST /api/bookings/create - Create a new booking
router.post('/create', bookingController.createBooking);

// GET /api/bookings/station/:stationId - Get all bookings for a station
router.get('/station/:stationId', bookingController.getStationBookings);

// GET /api/bookings/availability/:stationId - Get station port availability
router.get('/availability/:stationId', bookingController.getStationAvailability);

// GET /api/bookings/:bookingId - Get booking details
router.get('/:bookingId', bookingController.getBookingDetails);

// PUT /api/bookings/:bookingId/cancel - Cancel a booking
router.put('/:bookingId/cancel', bookingController.cancelBooking);

// PUT /api/bookings/:bookingId/complete - Mark booking as completed
router.put('/:bookingId/complete', bookingController.completeBooking);

// GET /api/bookings/user/:userEmail - Get user's bookings
router.get('/user/:userEmail', bookingController.getUserBookings);

module.exports = router;
