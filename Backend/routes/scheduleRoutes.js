const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const balancedScheduleController = require('../controllers/balancedScheduleController');

// POST /api/schedule/request - Smart scheduling
router.post('/request', scheduleController.scheduleRequest);

// POST /api/schedule/balanced - Balanced scheduling with grid constraints (Challenge 4)
router.post('/balanced', balancedScheduleController.scheduleBalanced);

// GET /api/schedule/station/:stationId - View station schedule
router.get('/station/:stationId', scheduleController.getStationSchedule);

// GET /api/schedule/vehicle/:vehicleId - View vehicle schedule
router.get('/vehicle/:vehicleId', scheduleController.getVehicleSchedule);

// GET /api/schedule/load/:stationId - Get station load distribution
router.get('/load/:stationId', scheduleController.getStationLoad);

// PUT /api/schedule/session/:sessionId/status - Update session status
router.put('/session/:sessionId/status', scheduleController.updateSessionStatus);

// DELETE /api/schedule/session/:sessionId - Cancel session
router.delete('/session/:sessionId', scheduleController.cancelSession);

module.exports = router;
