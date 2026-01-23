const openChargeService = require('../services/openChargeService');

// GET /api/stations/nearby - Get nearby stations
exports.getNearbyStations = async (req, res) => {
  try {
    const { lat, lng, radius, maxResults } = req.query;

    // Validation
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude (lat) and longitude (lng) are required'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = radius ? parseFloat(radius) : 10;
    const max = maxResults ? parseInt(maxResults) : 50;

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude'
      });
    }

    const stations = await openChargeService.getStationsByLocation(
      latitude,
      longitude,
      searchRadius,
      max
    );

    res.json({
      success: true,
      count: stations.length,
      searchParams: {
        lat: latitude,
        lng: longitude,
        radius: searchRadius
      },
      data: stations
    });
  } catch (error) {
    console.error('Error fetching nearby stations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby stations',
      error: error.message
    });
  }
};

// GET /api/stations/city/:cityName - Get stations by city
exports.getStationsByCity = async (req, res) => {
  try {
    const { cityName } = req.params;
    const { maxResults } = req.query;

    if (!cityName) {
      return res.status(400).json({
        success: false,
        message: 'City name is required'
      });
    }

    const max = maxResults ? parseInt(maxResults) : 50;

    const stations = await openChargeService.getNearbyStations(cityName, max);

    res.json({
      success: true,
      city: cityName,
      count: stations.length,
      data: stations
    });
  } catch (error) {
    console.error('Error fetching stations by city:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stations by city',
      error: error.message
    });
  }
};

// GET /api/stations/:id - Get station details
exports.getStationDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Station ID is required'
      });
    }

    const stationId = parseInt(id);

    if (isNaN(stationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid station ID'
      });
    }

    const details = await openChargeService.getStationDetails(stationId);

    res.json({
      success: true,
      data: details
    });
  } catch (error) {
    console.error('Error fetching station details:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Station not found',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching station details',
      error: error.message
    });
  }
};

// GET /api/stations/:id/capacity - Get station capacity
exports.getStationCapacity = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Station ID is required'
      });
    }

    const stationId = parseInt(id);

    if (isNaN(stationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid station ID'
      });
    }

    const capacity = await openChargeService.getStationCapacity(stationId);

    res.json({
      success: true,
      data: capacity
    });
  } catch (error) {
    console.error('Error fetching station capacity:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching station capacity',
      error: error.message
    });
  }
};

// POST /api/stations/:id/validate - Validate station for scheduling
exports.validateStation = async (req, res) => {
  try {
    const { id } = req.params;
    const { requiredPowerKW } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Station ID is required'
      });
    }

    const stationId = parseInt(id);
    const power = requiredPowerKW || 25; // Default to slow charging

    if (isNaN(stationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid station ID'
      });
    }

    const validation = await openChargeService.validateStationForScheduling(
      stationId,
      power
    );

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating station:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating station',
      error: error.message
    });
  }
};

// DELETE /api/stations/cache - Clear station cache (admin)
exports.clearCache = async (req, res) => {
  try {
    openChargeService.clearCache();

    res.json({
      success: true,
      message: 'Station cache cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing cache',
      error: error.message
    });
  }
};
