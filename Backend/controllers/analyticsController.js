const PowerUsageLog = require('../models/PowerUsageLog');

// GET /api/analytics/hourly?stationId=5
exports.getHourlyDemand = async (req, res) => {
  try {
    const { stationId } = req.query;

    if (!stationId) {
      return res.status(400).json({
        success: false,
        message: 'stationId is required'
      });
    }

    const hourlyData = await PowerUsageLog.aggregate([
      {
        $match: { stationId: parseInt(stationId) }
      },
      {
        $project: {
          hour: { $hour: '$timestamp' },
          powerKW: 1
        }
      },
      {
        $group: {
          _id: '$hour',
          avgPower: { $avg: '$powerKW' }
        }
      },
      {
        $project: {
          _id: 0,
          hour: '$_id',
          avgPower: { $round: ['$avgPower', 2] }
        }
      },
      {
        $sort: { hour: 1 }
      }
    ]);

    res.json({
      success: true,
      stationId: parseInt(stationId),
      data: hourlyData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hourly demand',
      error: error.message
    });
  }
};

// GET /api/analytics/peak?stationId=5
exports.getPeakHours = async (req, res) => {
  try {
    const { stationId } = req.query;

    if (!stationId) {
      return res.status(400).json({
        success: false,
        message: 'stationId is required'
      });
    }

    const peakData = await PowerUsageLog.aggregate([
      {
        $match: { stationId: parseInt(stationId) }
      },
      {
        $project: {
          hour: { $hour: '$timestamp' },
          powerKW: 1
        }
      },
      {
        $group: {
          _id: '$hour',
          avgPower: { $avg: '$powerKW' }
        }
      },
      {
        $sort: { avgPower: -1 }
      },
      {
        $limit: 3
      },
      {
        $project: {
          _id: 0,
          hour: '$_id'
        }
      }
    ]);

    const peakHours = peakData.map(item => item.hour);

    res.json({
      success: true,
      stationId: parseInt(stationId),
      peakHours
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching peak hours',
      error: error.message
    });
  }
};

// GET /api/analytics/region?region=Bangalore
exports.getRegionDemand = async (req, res) => {
  try {
    const { region } = req.query;

    if (!region) {
      return res.status(400).json({
        success: false,
        message: 'region is required'
      });
    }

    const regionData = await PowerUsageLog.aggregate([
      {
        $match: { region }
      },
      {
        $project: {
          date: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          powerKW: 1
        }
      },
      {
        $group: {
          _id: '$date',
          totalPower: { $sum: '$powerKW' }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalPower: { $round: ['$totalPower', 2] }
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    res.json({
      success: true,
      region,
      data: regionData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching region demand',
      error: error.message
    });
  }
};
