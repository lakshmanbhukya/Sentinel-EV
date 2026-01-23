const express = require('express');
const router = express.Router();
const gridController = require('../controllers/gridController');

// POST /api/grid/update - Update grid status
router.post('/update', gridController.updateGridStatus);

// GET /api/grid/status/:region - Get grid status for region
router.get('/status/:region', gridController.getGridStatus);

// GET /api/grid/all - Get all grid statuses
router.get('/all', gridController.getAllGridStatuses);

module.exports = router;
