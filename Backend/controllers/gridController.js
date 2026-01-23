const GridStatus = require('../models/GridStatus');

// POST /api/grid/update - Update grid status
exports.updateGridStatus = async (req, res) => {
  try {
    const { region, currentLoadKW, maxSafeLoadKW } = req.body;

    // Validation
    if (!region || currentLoadKW === undefined || maxSafeLoadKW === undefined) {
      return res.status(400).json({
        success: false,
        message: 'region, currentLoadKW, and maxSafeLoadKW are required'
      });
    }

    if (currentLoadKW < 0 || maxSafeLoadKW < 0) {
      return res.status(400).json({
        success: false,
        message: 'Load values must be non-negative'
      });
    }

    // Update or create grid status
    const gridStatus = await GridStatus.findOneAndUpdate(
      { region },
      {
        currentLoadKW,
        maxSafeLoadKW,
        updatedAt: new Date()
      },
      {
        new: true,
        upsert: true
      }
    );

    const loadPercentage = ((currentLoadKW / maxSafeLoadKW) * 100).toFixed(1);
    const status = loadPercentage > 90 ? 'critical' : 
                   loadPercentage > 75 ? 'high' : 
                   loadPercentage > 50 ? 'moderate' : 'normal';

    res.json({
      success: true,
      message: 'Grid status updated successfully',
      data: {
        region: gridStatus.region,
        currentLoadKW: gridStatus.currentLoadKW,
        maxSafeLoadKW: gridStatus.maxSafeLoadKW,
        loadPercentage: `${loadPercentage}%`,
        status,
        updatedAt: gridStatus.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating grid status',
      error: error.message
    });
  }
};

// GET /api/grid/status/:region - Get grid status
exports.getGridStatus = async (req, res) => {
  try {
    const { region } = req.params;

    const gridStatus = await GridStatus.findOne({ region });

    if (!gridStatus) {
      return res.status(404).json({
        success: false,
        message: 'Grid status not found for region'
      });
    }

    const loadPercentage = ((gridStatus.currentLoadKW / gridStatus.maxSafeLoadKW) * 100).toFixed(1);
    const status = loadPercentage > 90 ? 'critical' : 
                   loadPercentage > 75 ? 'high' : 
                   loadPercentage > 50 ? 'moderate' : 'normal';

    res.json({
      success: true,
      data: {
        region: gridStatus.region,
        currentLoadKW: gridStatus.currentLoadKW,
        maxSafeLoadKW: gridStatus.maxSafeLoadKW,
        availableCapacityKW: gridStatus.maxSafeLoadKW - gridStatus.currentLoadKW,
        loadPercentage: `${loadPercentage}%`,
        status,
        updatedAt: gridStatus.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching grid status',
      error: error.message
    });
  }
};

// GET /api/grid/all - Get all grid statuses
exports.getAllGridStatuses = async (req, res) => {
  try {
    const gridStatuses = await GridStatus.find().sort({ region: 1 });

    const data = gridStatuses.map(grid => {
      const loadPercentage = ((grid.currentLoadKW / grid.maxSafeLoadKW) * 100).toFixed(1);
      const status = loadPercentage > 90 ? 'critical' : 
                     loadPercentage > 75 ? 'high' : 
                     loadPercentage > 50 ? 'moderate' : 'normal';

      return {
        region: grid.region,
        currentLoadKW: grid.currentLoadKW,
        maxSafeLoadKW: grid.maxSafeLoadKW,
        loadPercentage: `${loadPercentage}%`,
        status,
        updatedAt: grid.updatedAt
      };
    });

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching grid statuses',
      error: error.message
    });
  }
};
