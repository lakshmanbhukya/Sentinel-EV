const schedulerService = require('../services/schedulerService');
const ChargingSession = require('../models/ChargingSession');

// POST /api/schedule/request - Smart scheduling
exports.scheduleRequest = async (req, res) => {
  try {
    const {
      vehicleId,
      stationId,
      requiredKwh,
      deadline,
      batteryLevel,
      priority
    } = req.body;

    // Validation
    if (!vehicleId || !stationId || !requiredKwh || !deadline || batteryLevel === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: vehicleId, stationId, requiredKwh, deadline, batteryLevel'
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

    // Schedule the session
    const result = await schedulerService.scheduleChargingSession({
      vehicleId,
      stationId,
      requiredKwh,
      deadline: deadlineDate,
      batteryLevel,
      priority: priority || false
    });

    res.status(201).json({
      success: true,
      message: 'Charging session scheduled successfully',
      data: result
    });
  } catch (error) {
    console.error('Schedule request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scheduling charging session',
      error: error.message
    });
  }
};

// GET /api/schedule/station/:stationId - View station schedule
exports.getStationSchedule = async (req, res) => {
  try {
    const { stationId } = req.params;
    const { startDate, endDate } = req.query;

    const sessions = await schedulerService.getStationSchedule(
      parseInt(stationId),
      startDate,
      endDate
    );

    res.json({
      success: true,
      stationId: parseInt(stationId),
      totalSessions: sessions.length,
      sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching station schedule',
      error: error.message
    });
  }
};

// GET /api/schedule/vehicle/:vehicleId - View vehicle schedule
exports.getVehicleSchedule = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const sessions = await schedulerService.getVehicleSchedule(vehicleId);

    res.json({
      success: true,
      vehicleId,
      totalSessions: sessions.length,
      sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle schedule',
      error: error.message
    });
  }
};

// GET /api/schedule/load/:stationId - Get station load distribution
exports.getStationLoad = async (req, res) => {
  try {
    const { stationId } = req.params;
    const { hours } = req.query;

    const distribution = await schedulerService.getStationLoadDistribution(
      parseInt(stationId),
      hours ? parseInt(hours) : 24
    );

    res.json({
      success: true,
      stationId: parseInt(stationId),
      distribution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching station load distribution',
      error: error.message
    });
  }
};

// PUT /api/schedule/session/:sessionId/status - Update session status
exports.updateSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;

    if (!['scheduled', 'charging', 'waiting', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const session = await ChargingSession.findByIdAndUpdate(
      sessionId,
      { status },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      message: 'Session status updated',
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating session status',
      error: error.message
    });
  }
};

// DELETE /api/schedule/session/:sessionId - Cancel session
exports.cancelSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ChargingSession.findByIdAndUpdate(
      sessionId,
      { status: 'cancelled' },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      message: 'Session cancelled successfully',
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling session',
      error: error.message
    });
  }
};
