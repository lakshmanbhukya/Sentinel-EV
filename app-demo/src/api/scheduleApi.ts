// Schedule API
// Wraps smart scheduling and load balancing endpoints

import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

// Request types
export interface ScheduleRequest {
  vehicleId: string;
  stationId: number;
  requiredKwh: number;
  deadline: string; // ISO date
  batteryLevel: number;
  priority?: boolean;
}

export interface BalancedScheduleRequest extends ScheduleRequest {
  maxDelayMinutes?: number;
  region: string;
}

// Response types
export interface ScheduledSession {
  _id: string;
  vehicleId: string;
  stationId: number;
  requiredKwh: number;
  deadline: string;
  batteryLevel: number;
  priority: boolean;
  scheduledStart: string;
  chargingRate: 'fast' | 'slow';
  status: 'scheduled' | 'charging' | 'waiting' | 'completed' | 'cancelled';
  reason?: string;
  requestTime: string;
  // Additional fields for balanced scheduling
  region?: string;
  maxDelayMinutes?: number;
  gridSafe?: boolean;
  actualDelayMinutes?: number;
}

export interface StationScheduleResponse {
  stationId: number;
  totalSessions: number;
  sessions: ScheduledSession[];
}

export interface VehicleScheduleResponse {
  vehicleId: string;
  totalSessions: number;
  sessions: ScheduledSession[];
}

export interface LoadDistributionPoint {
  hour: string;
  sessionCount: number;
  totalPowerKW: number;
}

export interface LoadDistributionResponse {
  stationId: number;
  distribution: LoadDistributionPoint[];
}

/**
 * Request a smart charging schedule
 */
export async function requestSmartSchedule(
  request: ScheduleRequest
): Promise<ScheduledSession | null> {
  const response = await apiPost<ScheduledSession>('/schedule/request', request);

  if (response?.success && response.data) {
    return response.data;
  }

  return null;
}

/**
 * Request a balanced schedule with grid constraints
 */
export async function requestBalancedSchedule(
  request: BalancedScheduleRequest
): Promise<ScheduledSession | null> {
  const response = await apiPost<ScheduledSession>('/schedule/balanced', request);

  if (response?.success && response.data) {
    return response.data;
  }

  return null;
}

/**
 * Get all scheduled sessions for a station
 */
export async function getStationSchedule(
  stationId: number,
  startDate?: string,
  endDate?: string
): Promise<ScheduledSession[] | null> {
  const params: Record<string, string | number> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await apiGet<StationScheduleResponse>(
    `/schedule/station/${stationId}`,
    Object.keys(params).length > 0 ? params : undefined
  );

  if (response?.success && response.data?.sessions) {
    return response.data.sessions;
  }

  return null;
}

/**
 * Get all scheduled sessions for a vehicle
 */
export async function getVehicleSchedule(
  vehicleId: string
): Promise<ScheduledSession[] | null> {
  const response = await apiGet<VehicleScheduleResponse>(
    `/schedule/vehicle/${encodeURIComponent(vehicleId)}`
  );

  if (response?.success && response.data?.sessions) {
    return response.data.sessions;
  }

  return null;
}

/**
 * Get hourly load distribution for a station
 */
export async function getStationLoadDistribution(
  stationId: number,
  hours: number = 24
): Promise<LoadDistributionPoint[] | null> {
  const response = await apiGet<LoadDistributionResponse>(
    `/schedule/load/${stationId}`,
    { hours }
  );

  if (response?.success && response.data?.distribution) {
    return response.data.distribution;
  }

  return null;
}

/**
 * Update session status
 */
export async function updateSessionStatus(
  sessionId: string,
  status: 'scheduled' | 'charging' | 'waiting' | 'completed' | 'cancelled'
): Promise<ScheduledSession | null> {
  const response = await apiPut<ScheduledSession>(
    `/schedule/session/${sessionId}/status`,
    { status }
  );

  if (response?.success && response.data) {
    return response.data;
  }

  return null;
}

/**
 * Cancel a scheduled session
 */
export async function cancelSession(
  sessionId: string
): Promise<boolean> {
  const response = await apiDelete<{ _id: string; status: string }>(
    `/schedule/session/${sessionId}`
  );

  return response?.success ?? false;
}
