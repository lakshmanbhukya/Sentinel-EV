// Hook: useScheduling
// Handles booking flow with fallback to mock simulation

import { useState } from 'react';
import { requestSmartSchedule } from '../api/scheduleApi';
import type { ScheduleRequest } from '../api/scheduleApi';
import { useDemoStore } from '../store/useDemoStore';

export function useScheduleBooking() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Access existing store actions for fallback
    const { simulateBooking } = useDemoStore();

    const scheduleBooking = async (
        stationId: string, 
        vehicleId: string = 'EV-DEMO-01'
    ): Promise<boolean> => {
        setIsSubmitting(true);
        setError(null);
        
        try {
            // Attempt valid backend call
            // We need to parse ID to number
            const numericId = parseInt(stationId.replace(/\D/g, ''));
            
            if (!isNaN(numericId)) {
                // Construct payload
                const payload: ScheduleRequest = {
                    vehicleId,
                    stationId: numericId,
                    requiredKwh: 30, // Default for demo
                    deadline: new Date(Date.now() + 3600000 * 2).toISOString(), // +2 hours
                    batteryLevel: 45
                };

                const result = await requestSmartSchedule(payload);
                
                if (result) {
                    // Success!
                    // We might need to update global store state here to reflect "Confirmed"
                    // But the existing store uses internal state.
                    // Ideally, we sync the store status.
                    // For now, we return true and let the caller handle UI transitions.
                    return true;
                }
            }
            
            // Fallback to simulation
            console.log('Using mock simulation for booking');
            await simulateBooking(stationId);
            return true;

        } catch (e) {
            console.warn('Booking failed, falling back', e);
            await simulateBooking(stationId);
            return true;
        } finally {
            setIsSubmitting(false);
        }
    };

    return { scheduleBooking, isSubmitting, error };
}
