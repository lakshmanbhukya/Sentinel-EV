const StationTelemetry = require('../models/StationTelemetry');
const Station = require('../models/Station');
const Alert = require('../models/Alert');
const { calculateStationStatus, checkAlertCondition } = require('../utils/statusCalculator');

class TelemetryService {
  /**
   * Record telemetry data for a station
   */
  async recordTelemetry(stationId, data) {
    const { temperature, load, powerKW, voltage, current } = data;
    
    // Calculate status
    const status = calculateStationStatus(temperature, load);
    
    // Create telemetry record
    const telemetry = new StationTelemetry({
      stationId,
      temperature,
      load,
      powerKW,
      voltage,
      current,
      status
    });
    
    await telemetry.save();
    
    // Update station status
    await Station.findOneAndUpdate(
      { stationId },
      { status }
    );
    
    // Check for alert conditions
    await this.checkAndCreateAlerts(stationId, temperature, load);
    
    return telemetry;
  }

  /**
   * Get latest telemetry for a station
   */
  async getLatestTelemetry(stationId) {
    return await StationTelemetry.findOne({ stationId })
      .sort({ timestamp: -1 })
      .lean();
  }

  /**
   * Get telemetry history for a station
   */
  async getTelemetryHistory(stationId, hours = 24, interval = '15m') {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Determine aggregation interval in minutes
    const intervalMinutes = this.parseInterval(interval);
    
    const telemetry = await StationTelemetry.aggregate([
      {
        $match: {
          stationId,
          timestamp: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: {
            $toDate: {
              $subtract: [
                { $toLong: '$timestamp' },
                { $mod: [{ $toLong: '$timestamp' }, intervalMinutes * 60 * 1000] }
              ]
            }
          },
          temperature: { $avg: '$temperature' },
          load: { $avg: '$load' },
          powerKW: { $avg: '$powerKW' },
          status: { $first: '$status' }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          time: '$_id',
          temp: { $round: ['$temperature', 1] },
          load: { $round: ['$load', 1] },
          powerKW: { $round: ['$powerKW', 1] },
          status: 1
        }
      }
    ]);
    
    return telemetry;
  }

  /**
   * Get telemetry for all stations (latest)
   */
  async getAllStationsTelemetry() {
    const stations = await Station.find({}).lean();
    
    const telemetryPromises = stations.map(async (station) => {
      const latest = await this.getLatestTelemetry(station.stationId);
      return {
        stationId: station.stationId,
        name: station.name,
        lat: station.location.coordinates[1],
        lng: station.location.coordinates[0],
        address: station.address,
        status: station.status,
        temp: latest?.temperature || 0,
        load: latest?.load || 0,
        powerKW: latest?.powerKW || 0
      };
    });
    
    return await Promise.all(telemetryPromises);
  }

  /**
   * Check and create alerts if thresholds exceeded
   */
  async checkAndCreateAlerts(stationId, temperature, load) {
    const station = await Station.findOne({ stationId });
    if (!station) return;
    
    const alerts = [];
    
    // Check temperature
    const tempAlert = checkAlertCondition(
      'temperature',
      temperature,
      station.operationalLimits.warningTemperature,
      stationId
    );
    if (tempAlert) alerts.push(tempAlert);
    
    // Check load
    const loadAlert = checkAlertCondition(
      'load',
      load,
      station.operationalLimits.warningLoad,
      stationId
    );
    if (loadAlert) alerts.push(loadAlert);
    
    // Create alerts if they don't already exist
    for (const alertData of alerts) {
      const existingAlert = await Alert.findOne({
        stationId,
        type: alertData.type,
        status: 'active'
      });
      
      if (!existingAlert) {
        await Alert.create(alertData);
      }
    }
  }

  /**
   * Parse interval string to minutes
   */
  parseInterval(interval) {
    const match = interval.match(/^(\d+)([mh])$/);
    if (!match) return 15; // default 15 minutes
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    return unit === 'h' ? value * 60 : value;
  }

  /**
   * Simulate telemetry data (for testing)
   */
  async simulateTelemetry(stationId) {
    const baseTemp = 70 + Math.random() * 20;
    const baseLoad = 50 + Math.random() * 30;
    
    return await this.recordTelemetry(stationId, {
      temperature: baseTemp,
      load: baseLoad,
      powerKW: baseLoad * 10,
      voltage: 400 + Math.random() * 20,
      current: baseLoad * 2
    });
  }
}

module.exports = new TelemetryService();
