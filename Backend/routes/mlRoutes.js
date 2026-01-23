const express = require('express');
const router = express.Router();
const mlController = require('../controllers/mlController');

// POST /api/ml/predict
router.post('/predict', mlController.predict);

// GET /api/forecast/peak?stationId=5
router.get('/peak', mlController.forecastPeakHours);

module.exports = router;
