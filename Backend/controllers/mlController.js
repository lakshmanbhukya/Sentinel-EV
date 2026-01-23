const axios = require('axios');
const PowerUsageLog = require('../models/PowerUsageLog');

const FLASK_URL = process.env.FLASK_ML_SERVICE_URL || 'http://localhost:5000';

// POST /api/ml/predict - Forward prediction request to Flask
exports.predict = async (req, res) => {
  try {
    const { stationId, hour, day_num } = req.body;

    if (stationId === undefined || hour === undefined || day_num === undefined) {
      return res.status(400).json({
        success: false,
        message: 'stationId, hour, and day_num are required'
      });
    }

    // Call Flask ML service
    const response = await axios.post(`${FLASK_URL}/predict`, {
      stationId,
      hour,
      day_num
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calling ML prediction service',
      error: error.response?.data || error.message
    });
  }
};

// GET /api/forecast/peak?stationId=5
exports.forecastPeakHours = async (req, res) => {
  try {
    const { stationId } = req.query;

    if (!stationId) {
      return res.status(400).json({
        success: false,
        message: 'stationId is required'
      });
    }

    // Get predictions for all 24 hours
    const predictions = [];
    const currentDay = new Date().getDay(); // 0-6 (Sunday-Saturday)

    for (let hour = 0; hour < 24; hour++) {
      try {
        const response = await axios.post(`${FLASK_URL}/predict`, {
          stationId: parseInt(stationId),
          hour,
          day_num: currentDay
        });

        predictions.push({
          hour,
          predicted_powerKW: response.data.predicted_powerKW
        });
      } catch (error) {
        console.error(`Error predicting hour ${hour}:`, error.message);
      }
    }

    // Sort by predicted power and get top 5 peak hours
    const peakHours = predictions
      .sort((a, b) => b.predicted_powerKW - a.predicted_powerKW)
      .slice(0, 5);

    res.json({
      success: true,
      stationId: parseInt(stationId),
      predictedPeakHours: peakHours
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error forecasting peak hours',
      error: error.message
    });
  }
};
