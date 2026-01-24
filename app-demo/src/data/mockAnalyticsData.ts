export interface HeatmapDataPoint {
  day: string;
  hour: number;
  value: number; // 0-100 usage intensity
}

export interface DemandPredictionPoint {
  time: string;
  actual?: number;
  predicted?: number;
  lowerBound?: number;
  upperBound?: number;
}

export interface OperationalMetrics {
  optimalHours: string[];
  energyDelivered: number; // kWh
  utilizationRate: number; // %
  peakHours: string;
  quietHours: string;
  carbonSaved: number; // kg
}

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Generate plausible heatmap data (high usage during day, low at night)
export const generateHeatmapData = (): HeatmapDataPoint[] => {
  const data: HeatmapDataPoint[] = [];
  
  DAYS.forEach(day => {
    for (let hour = 0; hour < 24; hour++) {
      let baseIntensity = 20;
      
      // Rush hours
      if (hour >= 8 && hour <= 10) baseIntensity = 85; 
      if (hour >= 17 && hour <= 19) baseIntensity = 90;
      
      // Normal day hours
      if (hour > 10 && hour < 17) baseIntensity = 60;
      
      // Sleeping hours
      if (hour >= 23 || hour < 5) baseIntensity = 10;
      
      // Weekend variance
      if (day === 'Sat' || day === 'Sun') {
        baseIntensity *= 0.8; // Slightly less usage
      }
      
      // Random fluctuation
      const value = Math.max(0, Math.min(100, Math.floor(baseIntensity + (Math.random() * 20 - 10))));
      
      data.push({ day, hour, value });
    }
  });
  
  return data;
};

// Generate demand prediction (past 12h actual, next 12h predicted)
export const generateDemandPrediction = (): DemandPredictionPoint[] => {
  const data: DemandPredictionPoint[] = [];
  const now = new Date();
  const currentHour = now.getHours();
  
  // Past 12 hours (Actuals)
  for (let i = 12; i > 0; i--) {
    const time = new Date(now);
    time.setHours(currentHour - i);
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actual: Math.floor(Math.random() * 40 + 40), // 40-80
    });
  }
  
  // Future 12 hours (Predicted)
  for (let i = 0; i <= 12; i++) {
    const time = new Date(now);
    time.setHours(currentHour + i);
    const predictedBase = Math.floor(Math.random() * 40 + 45); // Slightly higher trend
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      predicted: predictedBase,
      lowerBound: predictedBase - 10,
      upperBound: predictedBase + 10,
    });
  }

  // Smooth transition at "now": add a point with both to connect lines
  // The point representing 'now' is implicit at index 12
  // Currently we just have two separate sets implicitly. 
  // In charts, we often want the last actual point to connect to the first predicted point.
  // We'll handle visual connection in the chart component or just accept the gap/overlap style.
  
  return data;
};

export const generateStationMetrics = (stationId: string): OperationalMetrics => {
  // Generate station-specific metrics based on ID for consistency
  const stationHash = stationId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = stationHash % 100;
  
  // Create realistic patterns based on station characteristics
  const isHighTraffic = seed > 70;
  const isEcoStation = stationId.includes('eco') || stationId.includes('green');
  const isFastCharger = stationId.includes('fast') || stationId.includes('hub');
  
  let baseEnergyDelivered = 800 + (seed * 10);
  let baseUtilization = 45 + (seed % 40);
  let baseCarbonSaved = 150 + (seed * 2);
  
  // Adjust based on station type
  if (isHighTraffic) {
    baseEnergyDelivered *= 1.5;
    baseUtilization += 15;
    baseCarbonSaved *= 1.3;
  }
  
  if (isFastCharger) {
    baseEnergyDelivered *= 1.8;
    baseUtilization += 20;
  }
  
  if (isEcoStation) {
    baseCarbonSaved *= 1.6;
  }
  
  // Generate realistic optimal hours based on station pattern
  const optimalHours = isHighTraffic 
    ? ['02:30', '14:00'] 
    : ['01:00', '11:30'];
  
  const peakHours = isHighTraffic 
    ? '07:30 - 09:30, 17:00 - 19:30'
    : '08:00 - 10:00';
    
  const quietHours = isHighTraffic 
    ? '00:00 - 03:00'
    : '01:00 - 05:00';

  return {
    optimalHours,
    energyDelivered: Math.floor(baseEnergyDelivered),
    utilizationRate: Math.min(95, Math.floor(baseUtilization)),
    peakHours,
    quietHours,
    carbonSaved: Math.floor(baseCarbonSaved)
  };
};
