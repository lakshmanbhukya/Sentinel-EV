// Hook: useStationsData
// Fetches station data with automatic fallback to mock STATIONS

import { useState, useEffect } from 'react';
import { STATIONS } from '../data/mockData';
import type { Station } from '../data/mockData';
import { getNearbyStations } from '../api/stationsApi';
import { transformStation } from '../api/transformers';
import { isValidStationList } from '../api/validators';
import { CITY_STATIONS, CITIES } from '../data/cityStationsData';

// Helper to find nearest city to given coordinates
function findNearestCity(lat: number, lng: number) {
    let nearestCity = null;
    let minDistance = Infinity;
    
    for (const city of CITIES) {
        const distance = Math.sqrt(
            Math.pow(city.lat - lat, 2) + Math.pow(city.lng - lng, 2)
        );
        if (distance < minDistance) {
            minDistance = distance;
            nearestCity = city;
        }
    }
    
    return nearestCity;
}

export function useStationsData(lat: number = 40.7128, lng: number = -74.0060, radius: number = 10) {
    const [stations, setStations] = useState<Station[]>(STATIONS);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMock, setIsMock] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function fetchData() {
            console.log(`🔍 Fetching stations for coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}, radius: ${radius}km`);
            setIsLoading(true);
            try {
                // Attempt to fetch from backend
                const backendData = await getNearbyStations(lat, lng, radius);
                
                if (isMounted) {
                    if (backendData && isValidStationList(backendData) && backendData.length > 0) {
                        // Transform and use backend data
                        const transformed = backendData.map(transformStation);
                        console.log(`✅ Loaded ${transformed.length} real stations from API`);
                        setStations(transformed);
                        setIsMock(false);
                        setError(null);
                    } else {
                        // Fallback to city-based mock data
                        const nearestCity = findNearestCity(lat, lng);
                        if (nearestCity && CITY_STATIONS[nearestCity.name]) {
                            console.log(`⚠️ Using mock stations data for ${nearestCity.name} (${CITY_STATIONS[nearestCity.name].length} stations)`);
                            setStations(CITY_STATIONS[nearestCity.name]);
                            setIsMock(true);
                        } else {
                            console.log('⚠️ Using default mock stations data (backend unavailable or empty)');
                            setStations(STATIONS);
                            setIsMock(true);
                        }
                    }
                }
            } catch (err) {
                if (isMounted) {
                    console.warn('❌ Failed to fetch stations, falling back to city-based mock:', err);
                    // Fallback to city-based mock data
                    const nearestCity = findNearestCity(lat, lng);
                    if (nearestCity && CITY_STATIONS[nearestCity.name]) {
                        console.log(`📍 Using ${nearestCity.name} stations (${CITY_STATIONS[nearestCity.name].length} stations)`);
                        setStations(CITY_STATIONS[nearestCity.name]);
                    } else {
                        setStations(STATIONS);
                    }
                    setIsMock(true);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [lat, lng, radius]);

    return { stations, isLoading, error, isMock };
}
