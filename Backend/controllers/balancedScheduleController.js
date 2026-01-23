const balancedScheduler = require('../services/balancedScheduler');

// POST /api/schedule/balanced - Balanced scheduling with grid constraints
exports.scheduleBalanced = async (req, res) => {
  try {
    const {
      vehicleId,
      stationId,
      requiredKwh,
      deadline,
      maxDelayMinutes,
      batteryLevel,
      priority,
      region
    } = req.body;

    // Validation
    if (!vehicleId || !stationId || !requiredKwh || !deadline || batteryLevel === undefined || !region) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: vehicleId, stationId, requiredKwh, deadline, batteryLevel, region'
      });
    }

    // Validate deadline is in future
    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Deadline must be in the future'
      });
    }

    // Schedule with balanced algorithm
    const result = await balancedScheduler.scheduleBalanced({
      vehicleId,
      stationId,
      requiredKwh,
      deadline: deadlineDate,
      maxDelayMinutes: maxDelayMinutes || 60,
      batteryLevel,
      priority: priority || false,
      region
    });

    res.status(201).json({
      success: true,
      message: 'Charging session scheduled with grid balancing',
      data: result
    });
  } catch (error) {
    console.error('Balanced schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scheduling balanced charging session',
      error: error.message
    });
  }
};

// GET /api/report/grid-impact - Grid impact report
exports.getGridImpactReport = async (req, res) => {
  try {
    const { stationId, region } = req.query;

    if (!stationId || !region) {
      return res.status(400).json({
        success: false,
        message: 'stationId and region are required'
      });
    }

    const report = await balancedScheduler.getGridImpactReport(
      parseInt(stationId),
      region
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating grid impact report',
      error: error.message
    });
  }
};
