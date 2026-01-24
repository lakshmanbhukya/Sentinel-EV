// Hook: useGridStatus
// Fetches grid status with automatic fallback to mock GRID_STATS

import { useState, useEffect } from 'react';
import { GRID_STATS } from '../data/mockData';
import { getGridStatus } from '../api/gridApi';
import { transformGridStatus } from '../api/transformers';
import { isValidGridStatus } from '../api/validators';

// Infer type from mock data
type GridStatsType = typeof GRID_STATS;

export function useGridStatus(region: string = 'New York') {
    const [stats, setStats] = useState<GridStatsType>(GRID_STATS);
    const [isLoading, setIsLoading] = useState(true);
    const [isMock, setIsMock] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        async function fetchData() {
            setIsLoading(true);
            try {
                const apiData = await getGridStatus(region);
                
                if (isMounted) {
                    if (apiData && isValidGridStatus(apiData)) {
                        const transformed = transformGridStatus(apiData);
                        setStats(transformed);
                        setIsMock(false);
                    } else {
                        setStats(GRID_STATS);
                        setIsMock(true);
                    }
                }
            } catch (e) {
                if (isMounted) {
                    setStats(GRID_STATS);
                    setIsMock(true);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        
        // Refresh every 30 seconds
        fetchData();
        const interval = setInterval(fetchData, 30000);
        
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [region]);

    return { stats, isLoading, isMock };
}
