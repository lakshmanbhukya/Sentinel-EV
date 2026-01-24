// Analytics API
// Wraps demand analysis and pattern endpoints

import { apiGet } from './apiClient';

// Backend response types
export interface HourlyDemandPoint {
  hour: number;
  avgPower: number;
}

export interface HourlyDemandResponse {
  stationId: number;
  data: HourlyDemandPoint[];
}

export interface PeakHoursResponse {
  stationId: number;
  peakHours: number[];
}

export interface RegionalTrendPoint {
  date: string;
  totalPower: number;
}

export interface RegionalTrendResponse {
  region: string;
  data: RegionalTrendPoint[];
}

/**
 * Get hourly demand pattern for a station
 */
export async function getHourlyDemand(
  stationId: number
): Promise<HourlyDemandPoint[] | null> {
  const response = await apiGet<HourlyDemandPoint[]>('/analytics/hourly', {
    stationId,
  });

  // Handle both array response and wrapped response
  if (response?.success) {
    if (Array.isArray(response.data)) {
      return response.data;
    }
    // Backend might return { stationId, data: [...] }
    const typedResponse = response as unknown as { success: boolean; data: HourlyDemandResponse };
    if (typedResponse.data?.data) {
      return typedResponse.data.data;
    }
  }

  return null;
}

/**
 * Get peak hours for a station
 */
export async function getPeakHours(
  stationId: number
): Promise<number[] | null> {
  const response = await apiGet<PeakHoursResponse>('/analytics/peak', {
    stationId,
  });

  if (response?.success && response.data?.peakHours) {
    return response.data.peakHours;
  }

  return null;
}

/**
 * Get regional demand trend
 */
export async function getRegionalTrend(
  region: string
): Promise<RegionalTrendPoint[] | null> {
  const response = await apiGet<RegionalTrendResponse>('/analytics/region', {
    region,
  });

  if (response?.success && response.data?.data) {
    return response.data.data;
  }

  return null;
}
