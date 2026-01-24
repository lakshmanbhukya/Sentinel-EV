// Grid API
// Wraps grid status management endpoints

import { apiGet, apiPost } from './apiClient';

// Backend response types
export interface GridStatusData {
  region: string;
  currentLoadKW: number;
  maxSafeLoadKW: number;
  availableCapacityKW?: number;
  loadPercentage: string;
  status: 'normal' | 'moderate' | 'high' | 'critical';
  updatedAt: string;
}

export interface AllGridStatusesResponse {
  count: number;
  data: GridStatusData[];
}

/**
 * Get grid status for a specific region
 */
export async function getGridStatus(
  region: string
): Promise<GridStatusData | null> {
  const response = await apiGet<GridStatusData>(`/grid/status/${encodeURIComponent(region)}`);

  if (response?.success && response.data) {
    return response.data;
  }

  return null;
}

/**
 * Get grid status for all regions
 */
export async function getAllGridStatuses(): Promise<GridStatusData[] | null> {
  const response = await apiGet<GridStatusData[]>('/grid/all');

  // Handle both array response and wrapped response
  if (response?.success) {
    if (Array.isArray(response.data)) {
      return response.data;
    }
    const typedResponse = response as unknown as { success: boolean; data: AllGridStatusesResponse };
    if (typedResponse.data?.data) {
      return typedResponse.data.data;
    }
  }

  return null;
}

/**
 * Update grid status for a region
 */
export async function updateGridStatus(
  region: string,
  currentLoadKW: number,
  maxSafeLoadKW: number
): Promise<GridStatusData | null> {
  const response = await apiPost<GridStatusData>('/grid/update', {
    region,
    currentLoadKW,
    maxSafeLoadKW,
  });

  if (response?.success && response.data) {
    return response.data;
  }

  return null;
}
