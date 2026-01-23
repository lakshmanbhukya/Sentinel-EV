const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// GET /api/analytics/hourly?stationId=5
router.get('/hourly', analyticsController.getHourlyDemand);

// GET /api/analytics/peak?stationId=5
router.get('/peak', analyticsController.getPeakHours);

// GET /api/analytics/region?region=Bangalore
router.get('/region', analyticsController.getRegionDemand);

module.exports = router;
