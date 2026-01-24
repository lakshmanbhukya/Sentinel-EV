// API Validators
// Runtime validation helpers to ensure API responses match expected shapes

import type { BackendStation, StationCapacity } from './stationsApi';
import type { HourlyDemandPoint, RegionalTrendPoint } from './analyticsApi';
import type { GridStatusData } from './gridApi';

/**
 * Validates that a station object has required fields
 */
export function isValidStation(data: any): data is BackendStation {
  if (!data || typeof data !== 'object') return false;
  return (
    typeof data.id === 'number' &&
    typeof data.name === 'string' &&
    typeof data.latitude === 'number' &&
    typeof data.longitude === 'number'
  );
}

/**
 * Validates that a station list response is valid
 */
export function isValidStationList(data: any): data is BackendStation[] {
  if (!Array.isArray(data)) return false;
  return data.every(isValidStation);
}

/**
 * Validates hourly demand data
 */
export function isValidHourlyDemand(data: any): data is HourlyDemandPoint[] {
  if (!Array.isArray(data)) return false;
  return data.every(item => 
    typeof item === 'object' && 
    item !== null &&
    typeof item.hour === 'number' && 
    typeof item.avgPower === 'number'
  );
}

/**
 * Validates regional trend data
 */
export function isValidRegionalTrend(data: any): data is RegionalTrendPoint[] {
  if (!Array.isArray(data)) return false;
  return data.every(item => 
    typeof item === 'object' && 
    item !== null &&
    typeof item.date === 'string' && 
    typeof item.totalPower === 'number'
  );
}

/**
 * Validates grid status data
 */
export function isValidGridStatus(data: any): data is GridStatusData {
  if (!data || typeof data !== 'object') return false;
  return (
    typeof data.region === 'string' &&
    typeof data.currentLoadKW === 'number' &&
    typeof data.maxSafeLoadKW === 'number' &&
    typeof data.loadPercentage === 'string' &&
    typeof data.status === 'string'
  );
}

/**
 * Validates station capacity data
 */
export function isValidStationCapacity(data: any): data is StationCapacity {
  if (!data || typeof data !== 'object') return false;
  return (
    typeof data.stationId === 'number' &&
    typeof data.totalPorts === 'number' &&
    typeof data.availablePorts === 'number' &&
    typeof data.maxPowerKW === 'number'
  );
}
