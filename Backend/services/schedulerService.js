const axios = require('axios');
const ChargingSession = require('../models/ChargingSession');

const FLASK_URL = process.env.FLASK_ML_SERVICE_URL || 'http://localhost:5000';

// Configuration constants
const LOAD_THRESHOLD = 90; // kW - max safe load per station
const MAX_SESSIONS_PER_HOUR = 5; // max concurrent sessions per station
const FAST_CHARGING_RATE = 50; // kW
const SLOW_CHARGING_RATE = 25; // kW
const PREDICTION_WINDOW = 12; // hours to look ahead

class SchedulerService {
  /**
   * Main scheduling function
   * Finds optimal charging slot based on ML predictions and constraints
   */
  async scheduleChargingSession(requestData) {
    const {
      vehicleId,
      stationId,
      requiredKwh,
      deadline,
      batteryLevel,
      priority = false
    } = requestData;

    // Step D: Priority Override - immediate scheduling
    if (batteryLevel < 20 || priority) {
      return await this.scheduleImmediate(requestData, 'critical_battery_or_priority');
    }

    // Step A: Predict station load for next hours
    const predictions = await this.getPredictedLoads(stationId, PREDICTION_WINDOW);

    // Step B: Select best charging start time
    const optimalSlot = await this.findOptimalSlot(
      stationId,
      predictions,
      deadline,
      requiredKwh
    );

    if (!optimalSlot) {
      // No suitable slot found - schedule immediate with slow charging
      return await this.scheduleImmediate(requestData, 'no_optimal_slot_found');
    }

    // Step C: Charging Rate Control
    const chargingRate = optimalSlot.predictedLoad < LOAD_THRESHOLD * 0.7 ? 'fast' : 'slow';
    const rate = chargingRate === 'fast' ? FAST_CHARGING_RATE : SLOW_CHARGING_RATE;
    const estimatedDuration = Math.ceil((requiredKwh / rate) * 60); // minutes

    // Create and save session
    const session = new ChargingSession({
      vehicleId,
      stationId,
      requiredKwh,
      deadline,
      batteryLevel,
      priority,
      scheduledStart: optimalSlot.startTime,
      chargingRate,
      status: 'scheduled',
      reason: optimalSlot.reason,
      estimatedDuration
    });

    await session.save();

    return {
      vehicleId,
      stationId,
      scheduledStart: session.scheduledStart,
      chargingRate,
      reason: optimalSlot.reason,
      estimatedDuration,
      sessionId: session._id
    };
  }

  /**
   * Schedule immediate charging (priority cases)
   */
  async scheduleImmediate(requestData, reason) {
    const {
      vehicleId,
      stationId,
      requiredKwh,
      deadline,
      batteryLevel,
      priority
    } = requestData;

    const now = new Date();
    const chargingRate = batteryLevel < 20 ? 'fast' : 'slow';
    const rate = chargingRate === 'fast' ? FAST_CHARGING_RATE : SLOW_CHARGING_RATE;
    const estimatedDuration = Math.ceil((requiredKwh / rate) * 60);

    const session = new ChargingSession({
      vehicleId,
      stationId,
      requiredKwh,
      deadline,
      batteryLevel,
      priority,
      scheduledStart: now,
      chargingRate,
      status: 'scheduled',
      reason,
      estimatedDuration
    });

    await session.save();

    return {
      vehicleId,
      stationId,
      scheduledStart: session.scheduledStart,
      chargingRate,
      reason,
      estimatedDuration,
      sessionId: session._id
    };
  }

  /**
   * Get ML predictions for next N hours
   */
  async getPredictedLoads(stationId, hours) {
    const predictions = [];
    const now = new Date();
    const currentDay = now.getDay();

    for (let i = 0; i < hours; i++) {
      const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
      const hour = futureTime.getHours();

      try {
        const response = await axios.post(`${FLASK_URL}/predict`, {
          stationId,
          hour,
          day_num: currentDay
        });

        predictions.push({
          hour: i,
          startTime: futureTime,
          predictedLoad: response.data.predicted_powerKW
        });
      } catch (error) {
        console.error(`Error predicting hour ${i}:`, error.message);
        // Use fallback prediction
        predictions.push({
          hour: i,
          startTime: futureTime,
          predictedLoad: 70 // conservative fallback
        });
      }
    }

    return predictions;
  }

  /**
   * Find optimal charging slot
   * Step B + Step E: Load balancing
   */
  async findOptimalSlot(stationId, predictions, deadline, requiredKwh) {
    const deadlineTime = new Date(deadline);

    for (const prediction of predictions) {
      // Check if slot is before deadline
      if (prediction.startTime >= deadlineTime) {
        continue;
      }

      // Check predicted load threshold
      if (prediction.predictedLoad >= LOAD_THRESHOLD) {
        continue;
      }

      // Step E: Check station capacity (existing scheduled sessions)
      const existingSessions = await this.getSessionsAtTime(
        stationId,
        prediction.startTime
      );

      if (existingSessions >= MAX_SESSIONS_PER_HOUR) {
        continue;
      }

      // Found optimal slot
      let reason = 'optimal_slot_found';
      if (prediction.predictedLoad < LOAD_THRESHOLD * 0.5) {
        reason = 'low_demand_period';
      } else if (prediction.predictedLoad < LOAD_THRESHOLD * 0.7) {
        reason = 'moderate_demand_period';
      } else {
        reason = 'peak_hour_avoided';
      }

      return {
        startTime: prediction.startTime,
        predictedLoad: prediction.predictedLoad,
        reason
      };
    }

    return null; // No suitable slot found
  }

  /**
   * Count existing sessions at a specific time slot
   */
  async getSessionsAtTime(stationId, startTime) {
    const hourStart = new Date(startTime);
    hourStart.setMinutes(0, 0, 0);
    
    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hourEnd.getHours() + 1);

    const count = await ChargingSession.countDocuments({
      stationId,
      scheduledStart: {
        $gte: hourStart,
        $lt: hourEnd
      },
      status: { $in: ['scheduled', 'charging'] }
    });

    return count;
  }

  /**
   * Get schedule for a station
   */
  async getStationSchedule(stationId, startDate, endDate) {
    const query = {
      stationId,
      status: { $in: ['scheduled', 'charging'] }
    };

    if (startDate) {
      query.scheduledStart = { $gte: new Date(startDate) };
    }
    if (endDate) {
      query.scheduledStart = { ...query.scheduledStart, $lte: new Date(endDate) };
    }

    const sessions = await ChargingSession.find(query)
      .sort({ scheduledStart: 1 })
      .lean();

    return sessions;
  }

  /**
   * Get schedule for a vehicle
   */
  async getVehicleSchedule(vehicleId) {
    const sessions = await ChargingSession.find({
      vehicleId,
      status: { $in: ['scheduled', 'charging', 'waiting'] }
    })
      .sort({ scheduledStart: 1 })
      .lean();

    return sessions;
  }

  /**
   * Get load distribution for a station
   */
  async getStationLoadDistribution(stationId, hours = 24) {
    const now = new Date();
    const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const sessions = await ChargingSession.find({
      stationId,
      scheduledStart: { $gte: now, $lte: endTime },
      status: { $in: ['scheduled', 'charging'] }
    }).lean();

    // Group by hour
    const distribution = {};
    for (let i = 0; i < hours; i++) {
      const hourStart = new Date(now.getTime() + i * 60 * 60 * 1000);
      hourStart.setMinutes(0, 0, 0);
      const hourKey = hourStart.toISOString();
      distribution[hourKey] = {
        hour: hourStart.getHours(),
        sessionCount: 0,
        totalLoad: 0
      };
    }

    sessions.forEach(session => {
      const sessionHour = new Date(session.scheduledStart);
      sessionHour.setMinutes(0, 0, 0);
      const hourKey = sessionHour.toISOString();

      if (distribution[hourKey]) {
        distribution[hourKey].sessionCount++;
        const rate = session.chargingRate === 'fast' ? FAST_CHARGING_RATE : SLOW_CHARGING_RATE;
        distribution[hourKey].totalLoad += rate;
      }
    });

    return Object.values(distribution);
  }
}

module.exports = new SchedulerService();
