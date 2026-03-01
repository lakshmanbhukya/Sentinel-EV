// Hook: useAnalyticsData
// Fetches analytics data with automatic fallback to mock generators

import { useState, useEffect } from 'react';
import { 
    generateHeatmapData, 
    generateDemandPrediction 
} from '../data/mockAnalyticsData';
import type { HeatmapDataPoint, DemandPredictionPoint } from '../data/mockAnalyticsData';
import { forecastPeakHours } from '../api/mlApi';
import { transformDemandPrediction } from '../api/transformers';

export function useHourlyDemand(stationId: string) {
    const [data, setData] = useState<HeatmapDataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMock, setIsMock] = useState(true);

    useEffect(() => {
        // Enhanced mock data generation with station-specific patterns
        const enhancedData = generateHeatmapData();
        
        // Add station-specific variations based on ID
        const stationVariation = parseInt(stationId.replace(/\D/g, '')) || 1;
        const modifiedData = enhancedData.map(point => ({
            ...point,
            value: Math.max(0, Math.min(100, point.value + (stationVariation % 3 - 1) * 10))
        }));
        
        setData(modifiedData);
        setIsMock(true);
        setIsLoading(false);
    }, [stationId]);

    return { data, isLoading, isMock };
}

export function useDemandPrediction(stationId: string) {
    const [data, setData] = useState<DemandPredictionPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMock, setIsMock] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        async function fetchData() {
            setIsLoading(true);
            try {
                const numericId = parseInt(stationId.replace(/\D/g, ''));
                if (!isNaN(numericId)) {
                    // Try to get real ML prediction data
                    const peakHoursData = await forecastPeakHours(numericId);
                    
                    if (isMounted && peakHoursData && peakHoursData.length > 0) {
                        // Transform backend peak hours to frontend demand curve
                        const transformedData = transformDemandPrediction(peakHoursData.map(p => p.hour), stationId);
                        setData(transformedData);
                        setIsMock(false);
                        console.log(`📊 Using ML prediction data for station ${stationId}`);
                        return;
                    }
                }
                
                // Fallback to enhanced mock data
                if (isMounted) {
                    const mockData = generateDemandPrediction();
                    // Add station-specific prediction patterns
                    const stationVariation = parseInt(stationId.replace(/\D/g, '')) || 1;
                    const enhancedMockData = mockData.map(point => ({
                        ...point,
                        predicted: point.predicted ? point.predicted + (stationVariation % 5 - 2) * 3 : undefined,
                        actual: point.actual ? point.actual + (stationVariation % 4 - 1) * 2 : undefined
                    }));
                    
                    setData(enhancedMockData);
                    setIsMock(true);
                }

            } catch (e) {
                if (isMounted) {
                    console.warn('ML prediction failed, using enhanced mock data:', e);
                    setData(generateDemandPrediction());
                    setIsMock(true);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchData();
        return () => { isMounted = false; };
    }, [stationId]);

    return { data, isLoading, isMock };
}
