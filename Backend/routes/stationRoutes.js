const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');

// GET /api/stations/nearby - Get nearby stations by coordinates
router.get('/nearby', stationController.getNearbyStations);

// GET /api/stations/city/:cityName - Get stations by city name
router.get('/city/:cityName', stationController.getStationsByCity);

// GET /api/stations/:id - Get station details
router.get('/:id', stationController.getStationDetails);

// GET /api/stations/:id/capacity - Get station capacity
router.get('/:id/capacity', stationController.getStationCapacity);

// POST /api/stations/:id/validate - Validate station for scheduling
router.post('/:id/validate', stationController.validateStation);

// DELETE /api/stations/cache - Clear cache (admin)
router.delete('/cache', stationController.clearCache);

module.exports = router;
