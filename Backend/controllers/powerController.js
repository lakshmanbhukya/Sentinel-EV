const PowerUsageLog = require('../models/PowerUsageLog');

// POST /api/power/log - Store power usage log
exports.logPowerUsage = async (req, res) => {
  try {
    const { stationId, powerKW, activePorts, region } = req.body;

    // Validation
    if (!stationId || !powerKW || !region) {
      return res.status(400).json({
        success: false,
        message: 'stationId, powerKW, and region are required'
      });
    }

    const log = new PowerUsageLog({
      stationId,
      powerKW,
      activePorts: activePorts || 0,
      region
    });

    await log.save();

    res.status(201).json({
      success: true,
      message: 'Power usage logged successfully',
      data: log
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging power usage',
      error: error.message
    });
  }
};
