const axios = require('axios');
const ChargingSession = require('../models/ChargingSession');
const GridStatus = require('../models/GridStatus');

const FLASK_URL = process.env.FLASK_ML_SERVICE_URL || 'http://localhost:5000';

// Configuration constants
const FAST_CHARGING_RATE = 50; // kW
const SLOW_CHARGING_RATE = 25; // kW
const PREDICTION_WINDOW = 24; // hours
const GRID_SAFETY_MARGIN = 0.9; // 90% of max safe load

class BalancedScheduler {
  /**
   * Main balanced scheduling function
   * Balances user convenience with grid constraints
   */
  async scheduleBalanced(requestData) {
    const {
      vehicleId,
      stationId,
      requiredKwh,
      deadline,
      maxDelayMinutes = 60,
      batteryLevel,
      priority = false,
      region
    } = requestData;

    const requestTime = new Date();

    // Step D: Priority Override - immediate scheduling
    if (batteryLevel < 20 || priority) {
      return await this.scheduleImmediate(
        requestData,
        'critical_battery_or_priority',
        requestTime
      );
    }

    // Step A: Forecast Demand using ML Model
    const predictions = await this.getPredictedLoads(stationId, PREDICTION_WINDOW);

    // Get current grid status
    const gridStatus = await this.getGridStatus(region);

    // Step B & C: Find optimal slot considering grid constraints and user convenience
    const optimalSlot = await this.findBalancedSlot(
      stationId,
      region,
      predictions,
      gridStatus,
      deadline,
      maxDelayMinutes,
      requiredKwh,
      requestTime
    );

    if (!optimalSlot) {
      // No safe slot found - schedule immediate with slow charging
      return await this.scheduleImmediate(
        requestData,
        'no_safe_slot_found_immediate_slow',
        requestTime
      );
    }

    // Step E: Dynamic Charging Rate Adjustment
    const chargingRate = this.determineChargingRate(
      optimalSlot.predictedLoad,
      gridStatus.currentLoadKW,
      gridStatus.maxSafeLoadKW
    );

    const rate = chargingRate === 'fast' ? FAST_CHARGING_RATE : SLOW_CHARGING_RATE;
    const estimatedDuration = Math.ceil((requiredKwh / rate) * 60); // minutes
    const actualDelay = Math.round((optimalSlot.startTime - requestTime) / 60000); // minutes

    // Create and save session
    const session = new ChargingSession({
      vehicleId,
      stationId,
      region,
      requiredKwh,
      deadline,
      maxDelayMinutes,
      batteryLevel,
      priority,
      requestTime,
      scheduledStart: optimalSlot.startTime,
      chargingRate,
      status: 'scheduled',
      reason: optimalSlot.reason,
      estimatedDuration,
      gridSafe: optimalSlot.gridSafe,
      actualDelayMinutes: actualDelay
    });

    await session.save();

    return {
      vehicleId,
      stationId,
      scheduledStart: session.scheduledStart,
      chargingRate,
      gridSafe: optimalSlot.gridSafe,
      reason: optimalSlot.reason,
      estimatedDuration,
      actualDelayMinutes: actualDelay,
      sessionId: session._id
    };
  }

  /**
   * Schedule immediate charging (priority cases)
   */
  async scheduleImmediate(requestData, reason, requestTime) {
    const {
      vehicleId,
      stationId,
      region,
      requiredKwh,
      deadline,
      maxDelayMinutes = 60,
      batteryLevel,
      priority
    } = requestData;

    const now = new Date();
    const chargingRate = batteryLevel < 20 ? 'fast' : 'slow';
    const rate = chargingRate === 'fast' ? FAST_CHARGING_RATE : SLOW_CHARGING_RATE;
    const estimatedDuration = Math.ceil((requiredKwh / rate) * 60);

    // Check if this will overload grid
    const gridStatus = await this.getGridStatus(region);
    const gridSafe = (gridStatus.currentLoadKW + rate) <= gridStatus.maxSafeLoadKW;

    const session = new ChargingSession({
      vehicleId,
      stationId,
      region,
      requiredKwh,
      deadline,
      maxDelayMinutes,
      batteryLevel,
      priority,
      requestTime,
      scheduledStart: now,
      chargingRate,
      status: 'scheduled',
      reason,
      estimatedDuration,
      gridSafe,
      actualDelayMinutes: 0
    });

    await session.save();

    return {
      vehicleId,
      stationId,
      scheduledStart: session.scheduledStart,
      chargingRate,
      gridSafe,
      reason,
      estimatedDuration,
      actualDelayMinutes: 0,
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
   * Get current grid status for region
   */
  async getGridStatus(region) {
    let gridStatus = await GridStatus.findOne({ region });

    if (!gridStatus) {
      // Create default grid status if not exists
      gridStatus = new GridStatus({
        region,
        currentLoadKW: 0,
        maxSafeLoadKW: 500 // default safe limit
      });
      await gridStatus.save();
    }

    return gridStatus;
  }

  /**
   * Find balanced slot considering grid constraints and user convenience
   * Step B & C implementation
   */
  async findBalancedSlot(
    stationId,
    region,
    predictions,
    gridStatus,
    deadline,
    maxDelayMinutes,
    requiredKwh,
    requestTime
  ) {
    const deadlineTime = new Date(deadline);
    const maxDelayTime = new Date(requestTime.getTime() + maxDelayMinutes * 60 * 1000);
    const effectiveDeadline = maxDelayTime < deadlineTime ? maxDelayTime : deadlineTime;

    for (const prediction of predictions) {
      // Step C: User Convenience Rule - only consider slots within delay tolerance
      if (prediction.startTime > effectiveDeadline) {
        continue;
      }

      // Step B: Grid Constraint Rule
      const estimatedChargingLoad = FAST_CHARGING_RATE; // assume fast initially
      const totalLoad = prediction.predictedLoad + gridStatus.currentLoadKW + estimatedChargingLoad;
      const safeThreshold = gridStatus.maxSafeLoadKW * GRID_SAFETY_MARGIN;

      const gridSafe = totalLoad <= safeThreshold;

      // If grid is not safe, skip this slot unless it's the only option
      if (!gridSafe && prediction.hour < predictions.length - 1) {
        continue;
      }

      // Check station capacity
      const existingSessions = await this.getSessionsAtTime(stationId, prediction.startTime);
      if (existingSessions >= 5) {
        continue;
      }

      // Found suitable slot
      let reason = 'balanced_schedule';
      if (gridSafe && prediction.predictedLoad < safeThreshold * 0.5) {
        reason = 'shifted_to_off_peak';
      } else if (gridSafe && prediction.predictedLoad < safeThreshold * 0.7) {
        reason = 'grid_safe_moderate_load';
      } else if (gridSafe) {
        reason = 'grid_safe_near_capacity';
      } else {
        reason = 'grid_constraint_override';
      }

      return {
        startTime: prediction.startTime,
        predictedLoad: prediction.predictedLoad,
        gridSafe,
        reason
      };
    }

    return null;
  }

  /**
   * Step E: Determine charging rate based on grid status
   */
  determineChargingRate(predictedLoad, currentGridLoad, maxSafeLoad) {
    const totalLoad = predictedLoad + currentGridLoad;
    const loadPercentage = totalLoad / maxSafeLoad;

    if (loadPercentage > 0.85) {
      return 'slow'; // Grid near capacity
    } else if (loadPercentage > 0.7) {
      return 'slow'; // Grid moderately loaded
    } else {
      return 'fast'; // Grid has capacity
    }
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
   * Get grid impact report
   */
  async getGridImpactReport(stationId, region) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get all sessions for the station in last 24 hours
    const sessions = await ChargingSession.find({
      stationId,
      requestTime: { $gte: oneDayAgo },
      status: { $in: ['scheduled', 'charging', 'completed'] }
    });

    if (sessions.length === 0) {
      return {
        stationId,
        region,
        peakLoadReducedBy: '0%',
        offPeakShiftedSessions: 0,
        averageUserDelayMinutes: 0,
        totalSessions: 0
      };
    }

    // Calculate metrics
    const offPeakShifted = sessions.filter(s => 
      s.reason && (
        s.reason.includes('off_peak') || 
        s.reason.includes('shifted')
      )
    ).length;

    const totalDelay = sessions.reduce((sum, s) => sum + (s.actualDelayMinutes || 0), 0);
    const avgDelay = Math.round(totalDelay / sessions.length);

    // Estimate peak load reduction
    // Assume each shifted session would have added 50kW during peak
    const estimatedPeakReduction = (offPeakShifted * 50) / (sessions.length * 50);
    const peakReductionPercent = Math.round(estimatedPeakReduction * 100);

    return {
      stationId,
      region,
      peakLoadReducedBy: `${peakReductionPercent}%`,
      offPeakShiftedSessions: offPeakShifted,
      averageUserDelayMinutes: avgDelay,
      totalSessions: sessions.length,
      gridSafeSessions: sessions.filter(s => s.gridSafe).length,
      slowChargingSessions: sessions.filter(s => s.chargingRate === 'slow').length
    };
  }
}

module.exports = new BalancedScheduler();
