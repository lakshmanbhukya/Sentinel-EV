/**
 * Calculate station status based on temperature and load
 * @param {number} temp - Temperature in Celsius
 * @param {number} load - Load percentage (0-100)
 * @returns {string} - 'safe', 'warning', or 'critical'
 */
function calculateStationStatus(temp, load) {
  // Critical conditions
  if (temp >= 110 || load >= 91) {
    return 'critical';
  }
  
  // Warning conditions
  if (temp >= 85 || load >= 71) {
    return 'warning';
  }
  
  // Safe
  return 'safe';
}

/**
 * Calculate grid stress level
 * @param {number} totalLoad - Total grid load in kW
 * @param {number} maxCapacity - Maximum grid capacity in kW
 * @param {number} criticalStations - Number of critical stations
 * @returns {string} - 'NORMAL', 'WARNING', or 'CRITICAL'
 */
function calculateGridStress(totalLoad, maxCapacity, criticalStations) {
  const loadPercentage = (totalLoad / maxCapacity) * 100;
  
  if (loadPercentage >= 90 || criticalStations > 2) {
    return 'CRITICAL';
  }
  
  if (loadPercentage >= 75 || criticalStations > 0) {
    return 'WARNING';
  }
  
  return 'NORMAL';
}

/**
 * Calculate grid efficiency
 * @param {number} actualLoad - Actual load in kW
 * @param {number} optimalLoad - Optimal load in kW
 * @returns {number} - Efficiency percentage
 */
function calculateEfficiency(actualLoad, optimalLoad) {
  if (optimalLoad === 0) return 0;
  return Math.round((actualLoad / optimalLoad) * 100);
}

/**
 * Format load value for display
 * @param {number} loadKW - Load in kilowatts
 * @returns {string} - Formatted string (e.g., "842 MW" or "125 kW")
 */
function formatLoad(loadKW) {
  if (loadKW >= 1000) {
    return `${(loadKW / 1000).toFixed(0)} MW`;
  }
  return `${loadKW.toFixed(0)} kW`;
}

/**
 * Determine if alert should be created
 * @param {string} type - Alert type
 * @param {number} value - Current value
 * @param {number} threshold - Threshold value
 * @returns {object|null} - Alert object or null
 */
function checkAlertCondition(type, value, threshold, stationId) {
  if (value >= threshold) {
    const severity = value >= threshold * 1.2 ? 'critical' : 'warning';
    
    return {
      stationId,
      type,
      severity,
      value,
      threshold,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} ${severity}`,
      message: `${type} has reached ${value} (threshold: ${threshold})`
    };
  }
  
  return null;
}

module.exports = {
  calculateStationStatus,
  calculateGridStress,
  calculateEfficiency,
  formatLoad,
  checkAlertCondition
};
