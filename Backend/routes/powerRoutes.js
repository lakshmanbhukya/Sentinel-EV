const express = require('express');
const router = express.Router();
const powerController = require('../controllers/powerController');

// POST /api/power/log
router.post('/log', powerController.logPowerUsage);

module.exports = router;
