const express = require('express');
const router = express.Router();
const balancedScheduleController = require('../controllers/balancedScheduleController');

// GET /api/report/grid-impact - Grid impact report
router.get('/grid-impact', balancedScheduleController.getGridImpactReport);

module.exports = router;
