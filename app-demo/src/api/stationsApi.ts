// Stations API
// Wraps OpenCharge integration endpoints

import { apiGet, apiPost } from './apiClient';

// Backend response types
export interface StationConnection {
  id?: number;
  connectionType: string;
  powerKW: number;
  currentType: string;
  quantity: number;
  statusType?: string;
}

export interface BackendStation {
  id: number;
  name: string;
  addressLine1: string;
  town: string;
  stateOrProvince?: string;
  postcode?: string;
  country?: string;
  latitude: number;
  longitude: number;
  distance?: number;
  numberOfPoints: number;
  usageType: string;
  statusType: string;
  connections?: StationConnection[];
  operatorInfo?: {
    title: string;
    websiteURL?: string;
  };
}

export interface StationCapacity {
  stationId: number;
  totalPorts: number;
  availablePorts: number;
  maxPowerKW: number;
  supportedConnectors: string[];
  canSchedule: boolean;
}

export interface NearbyStationsResponse {
  count: number;
  searchParams: {
    lat: number;
    lng: number;
    radius: number;
  };
  data: BackendStation[];
}

export interface CityStationsResponse {
  city: string;
  count: number;
  data: BackendStation[];
}

/**
 * Get charging stations near a location
 */
export async function getNearbyStations(
  lat: number,
  lng: number,
  radius: number = 10,
  maxResults: number = 50
): Promise<BackendStation[] | null> {
  const response = await apiGet<BackendStation[]>('/stations/nearby', {
    lat,
    lng,
    radius,
    maxResults,
  });

  if (response?.success && response.data) {
    return response.data;
  }

  return null;
}

/**
 * Get charging stations in a specific city
 */
export async function getStationsByCity(
  cityName: string,
  maxResults: number = 50
): Promise<BackendStation[] | null> {
  const response = await apiGet<BackendStation[]>(`/stations/city/${encodeURIComponent(cityName)}`, {
    maxResults,
  });

  if (response?.success && response.data) {
    return response.data;
  }

  return null;
}

/**
 * Get detailed information about a specific station
 */
export async function getStationDetails(
  stationId: number
): Promise<BackendStation | null> {
  const response = await apiGet<BackendStation>(`/stations/${stationId}`);

  if (response?.success && response.data) {
    return response.data;
  }

  return null;
}

/**
 * Get capacity information for a station
 */
export async function getStationCapacity(
  stationId: number
): Promise<StationCapacity | null> {
  const response = await apiGet<StationCapacity>(`/stations/${stationId}/capacity`);

  if (response?.success && response.data) {
    return response.data;
  }

  return null;
}

/**
 * Validate if a station can handle a charging request
 */
export async function validateStation(
  stationId: number,
  requiredPowerKW: number = 25
): Promise<{ isValid: boolean; message: string } | null> {
  const response = await apiPost<{
    stationId: number;
    isValid: boolean;
    canProvidePower: boolean;
    availablePowerKW: number;
    message: string;
  }>(`/stations/${stationId}/validate`, { requiredPowerKW });

  if (response?.success && response.data) {
    return {
      isValid: response.data.isValid,
      message: response.data.message,
    };
  }

  return null;
}
