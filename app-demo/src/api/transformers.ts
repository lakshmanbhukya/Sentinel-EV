// API Transformers
// Transforms backend data types to frontend interfaces

import type { BackendStation } from './stationsApi';
import type { Station } from '../data/mockData';
import type { HeatmapDataPoint } from '../data/mockAnalyticsData';
import type { HourlyDemandPoint } from './analyticsApi';
import type { GridStatusData } from './gridApi';

/**
 * Transform backend station to frontend Station interface
 */
export function transformStation(backendStation: BackendStation): Station {
  // Determine status based on OpenCharge status or random if missing
  // Backend provides 'statusType', map it to frontend 'safe' | 'warning' | 'critical'
  let mappedStatus: 'safe' | 'warning' | 'critical' = 'safe';
  
  if (backendStation.statusType) {
    const status = backendStation.statusType.toLowerCase();
    if (status.includes('fail') || status.includes('broken') || status.includes('offline')) {
      mappedStatus = 'critical';
    } else if (status.includes('busy') || status.includes('full')) {
      mappedStatus = 'warning';
    }
  }

  // Generate plausible load/temp if not provided directly
  // Note: Real backend might provide these real-time in a separate specific endpoint
  // For the demo integration, we'll simulate them or map if available
  const load = Math.floor(Math.random() * 80) + 10; 
  const temp = Math.floor(Math.random() * 40) + 40;

  return {
    id: String(backendStation.id),
    name: backendStation.name || `Station ${backendStation.id}`,
    lat: backendStation.latitude,
    lng: backendStation.longitude,
    status: mappedStatus,
    load,
    temp,
    address: [
      backendStation.addressLine1,
      backendStation.town,
      backendStation.stateOrProvince
    ].filter(Boolean).join(', ') || 'Unknown Address'
  };
}

/**
 * Transform hourly demand to HeatmapDataPoint with enhanced realism
 */
export function transformHourlyDemand(
  data: HourlyDemandPoint[], 
  day: string = 'Mon'
): HeatmapDataPoint[] {
  return data.map(point => ({
    day,
    hour: point.hour,
    value: Math.min(100, Math.max(0, point.avgPower)) // Normalize if needed, or assume backend is scaled
  }));
}

/**
 * Transform backend demand prediction to frontend format
 * Converts simple peak hours to full demand curve visualization
 */
export function transformDemandPrediction(
  peakHours: number[],
  stationId: string
): Array<{
  time: string;
  actual?: number;
  predicted?: number;
  lowerBound?: number;
  upperBound?: number;
}> {
  const data = [];
  const now = new Date();
  const currentHour = now.getHours();
  
  // Generate past 12 hours (actual data simulation)
  for (let i = 12; i > 0; i--) {
    const time = new Date(now);
    time.setHours(currentHour - i);
    
    // Check if this hour was a peak hour (simulate historical peaks)
    const isPeakHour = peakHours.includes(time.getHours());
    const baseValue = isPeakHour ? 70 + Math.random() * 20 : 30 + Math.random() * 30;
    
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actual: Math.floor(baseValue)
    });
  }
  
  // Generate future 12 hours (predicted data)
  for (let i = 0; i <= 12; i++) {
    const time = new Date(now);
    time.setHours(currentHour + i);
    
    // Use peak hours to influence predictions
    const isPeakHour = peakHours.includes(time.getHours());
    const predictedBase = isPeakHour ? 75 + Math.random() * 15 : 35 + Math.random() * 25;
    
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      predicted: Math.floor(predictedBase),
      lowerBound: Math.floor(predictedBase - 10),
      upperBound: Math.floor(predictedBase + 10)
    });
  }
  
  return data;
}

/**
 * Transform grid status to frontend GridStats format
 */
export function transformGridStatus(data: GridStatusData) {
  // Frontend GridStats:
  // totalLoad: string;      // "842 MW"
  // gridStress: string;     // "CRITICAL"
  // activeAlerts: number;   // 3
  // efficiency: string;     // "68%"

  return {
    totalLoad: `${data.currentLoadKW} kW`,
    gridStress: data.status.toUpperCase(),
    activeAlerts: data.status === 'critical' ? 3 : (data.status === 'high' ? 1 : 0),
    efficiency: `${Math.round((1 - (data.currentLoadKW / data.maxSafeLoadKW)) * 100)}%`
  };
}
