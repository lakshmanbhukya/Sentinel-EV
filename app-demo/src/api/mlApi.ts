// ML API
// Wraps ML prediction and forecasting endpoints

import { apiGet, apiPost } from './apiClient';

// Backend response types
export interface PowerPrediction {
  predicted_powerKW: number;
}

export interface PeakHourPrediction {
  hour: number;
  predicted_powerKW: number;
}

export interface ForecastPeakResponse {
  stationId: number;
  predictedPeakHours: PeakHourPrediction[];
}

/**
 * Get ML-based power prediction for a specific hour
 */
export async function predictPower(
  stationId: number,
  hour: number,
  dayNum: number
): Promise<number | null> {
  const response = await apiPost<PowerPrediction>('/ml/predict', {
    stationId,
    hour,
    day_num: dayNum,
  });

  if (response?.success && response.data?.predicted_powerKW !== undefined) {
    return response.data.predicted_powerKW;
  }

  return null;
}

/**
 * Forecast peak hours for the next 24 hours
 */
export async function forecastPeakHours(
  stationId: number
): Promise<PeakHourPrediction[] | null> {
  const response = await apiGet<ForecastPeakResponse>('/forecast/peak', {
    stationId,
  });

  if (response?.success && response.data?.predictedPeakHours) {
    return response.data.predictedPeakHours;
  }

  return null;
}
