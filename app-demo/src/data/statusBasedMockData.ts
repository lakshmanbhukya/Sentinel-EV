// Status-based mock data for EVStationSidebar
// Different data for critical (red), warning (yellow), and safe (green) stations

export interface StatusMetrics {
  oilTemp: number;
  load: number;
  voltage: string;
  frequency: string;
  efficiency: number;
  uptime: number;
  powerFactor: number;
  harmonicDistortion: number;
  statusMessage: string;
  systemStatus: string;
  recommendations: string[];
  alertLevel: 'critical' | 'warning' | 'safe';
}

// CRITICAL (RED) - Station in danger, needs immediate attention
export const CRITICAL_METRICS: StatusMetrics = {
  oilTemp: 108,
  load: 96,
  voltage: '492V',
  frequency: '60.2Hz',
  efficiency: 72,
  uptime: 87,
  powerFactor: 0.78,
  harmonicDistortion: 8.2,
  statusMessage: '⚠ EV ENERGY LIMIT EXCEEDED',
  systemStatus: 'CRITICAL OVERLOAD',
  recommendations: [
    'Immediate load reduction required',
    'Schedule emergency maintenance',
    'Activate backup cooling system',
    'Redistribute load to nearby stations'
  ],
  alertLevel: 'critical'
};

// WARNING (YELLOW) - Station needs attention soon
export const WARNING_METRICS: StatusMetrics = {
  oilTemp: 85,
  load: 78,
  voltage: '485V',
  frequency: '60.1Hz',
  efficiency: 88,
  uptime: 94,
  powerFactor: 0.89,
  harmonicDistortion: 4.5,
  statusMessage: '⚠ ELEVATED TEMPERATURE',
  systemStatus: 'MONITORING REQUIRED',
  recommendations: [
    'Monitor temperature trends',
    'Consider load balancing',
    'Schedule preventive maintenance',
    'Check cooling system performance'
  ],
  alertLevel: 'warning'
};

// SAFE (GREEN) - Station operating normally
export const SAFE_METRICS: StatusMetrics = {
  oilTemp: 62,
  load: 45,
  voltage: '480V',
  frequency: '60.0Hz',
  efficiency: 96,
  uptime: 99,
  powerFactor: 0.95,
  harmonicDistortion: 2.1,
  statusMessage: '✓ SYSTEM NOMINAL',
  systemStatus: 'OPTIMAL PERFORMANCE',
  recommendations: [
    'All systems operating normally',
    'Continue routine monitoring',
    'Next scheduled maintenance in 45 days',
    'Energy efficiency at peak levels'
  ],
  alertLevel: 'safe'
};

// Helper function to get metrics based on status
export function getMetricsByStatus(status: 'critical' | 'warning' | 'safe'): StatusMetrics {
  switch (status) {
    case 'critical':
      return CRITICAL_METRICS;
    case 'warning':
      return WARNING_METRICS;
    case 'safe':
      return SAFE_METRICS;
    default:
      return SAFE_METRICS;
  }
}

// Generate energy data with status-specific characteristics
export function generateStatusBasedEnergyData(status: 'critical' | 'warning' | 'safe') {
  const data = [];
  const metrics = getMetricsByStatus(status);
  let currentTemp = metrics.oilTemp;
  
  // Status-specific behavior
  const config = {
    critical: { trend: 0.5, volatility: 3, baseTemp: 105 },
    warning: { trend: 0.2, volatility: 2, baseTemp: 82 },
    safe: { trend: 0, volatility: 1, baseTemp: 60 }
  };
  
  const { trend, volatility, baseTemp } = config[status];
  currentTemp = baseTemp;
  
  for (let i = 0; i < 20; i++) {
    const time = new Date();
    time.setMinutes(time.getMinutes() + (i * 15));
    
    const noise = (Math.random() * 2 - 1) * volatility;
    currentTemp += trend + noise;
    
    // Keep within realistic bounds
    if (status === 'critical') {
      currentTemp = Math.min(Math.max(currentTemp, 100), 115);
    } else if (status === 'warning') {
      currentTemp = Math.min(Math.max(currentTemp, 75), 95);
    } else {
      currentTemp = Math.min(Math.max(currentTemp, 50), 75);
    }
    
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: parseFloat(currentTemp.toFixed(1)),
      limit: 110
    });
  }
  return data;
}

// Status-specific operational data
export interface OperationalData {
  activeChargers: number;
  totalChargers: number;
  energyDelivered: string;
  peakDemand: string;
  avgSessionTime: string;
  utilizationRate: number;
}

export const CRITICAL_OPERATIONAL: OperationalData = {
  activeChargers: 8,
  totalChargers: 8,
  energyDelivered: '2,847 kWh',
  peakDemand: '450 kW',
  avgSessionTime: '52 min',
  utilizationRate: 100
};

export const WARNING_OPERATIONAL: OperationalData = {
  activeChargers: 6,
  totalChargers: 8,
  energyDelivered: '1,923 kWh',
  peakDemand: '320 kW',
  avgSessionTime: '38 min',
  utilizationRate: 75
};

export const SAFE_OPERATIONAL: OperationalData = {
  activeChargers: 3,
  totalChargers: 8,
  energyDelivered: '1,245 kWh',
  peakDemand: '180 kW',
  avgSessionTime: '28 min',
  utilizationRate: 38
};

export function getOperationalDataByStatus(status: 'critical' | 'warning' | 'safe'): OperationalData {
  switch (status) {
    case 'critical':
      return CRITICAL_OPERATIONAL;
    case 'warning':
      return WARNING_OPERATIONAL;
    case 'safe':
      return SAFE_OPERATIONAL;
    default:
      return SAFE_OPERATIONAL;
  }
}
