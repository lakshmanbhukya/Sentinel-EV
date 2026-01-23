import { create } from 'zustand';
import { STATIONS } from '../data/mockData';
import type { Station } from '../data/mockData';

interface DemoState {
  // UI State
  view: 'intro' | 'map' | 'dashboard';
  selectedStation: Station | null;
  isBookingModalOpen: boolean;
  
  // Simulation State
  stations: Station[];
  bookingStatus: 'idle' | 'analyzing' | 'conflict' | 'optimized' | 'confirmed';
  
  // Slot Booking State
  slotStates: Record<string, StationSlotState>;

  // Actions
  setView: (view: 'intro' | 'map' | 'dashboard') => void;
  selectStation: (station: Station | null) => void;
  openBooking: () => void;
  closeBooking: () => void;
  resetSimulation: () => void;
  simulateBooking: (stationId: string) => Promise<void>;
  acceptOptimization: () => void;
  
  // New Slot Actions
  initializeSlots: (stationId: string) => void;
  bookSlot: (stationId: string, vehicleNumber: string, isEmergency: boolean) => boolean;
}

export interface StationSlotState {
    totalSlots: number;
    availableSlots: number;
    occupiedSlots: number;
    emergencySlots: number;
}

export const useDemoStore = create<DemoState>((set, get) => ({
  view: 'intro',
  selectedStation: null,
  isBookingModalOpen: false,
  stations: STATIONS,
  bookingStatus: 'idle',
  slotStates: {},

  setView: (view) => set({ view }),
  selectStation: (station) => {
      set({ selectedStation: station });
      if (station) {
          get().initializeSlots(station.id);
      }
  },
  openBooking: () => set({ isBookingModalOpen: true, bookingStatus: 'idle' }),
  closeBooking: () => set({ isBookingModalOpen: false }),
  
  resetSimulation: () => set({ 
    stations: STATIONS, 
    bookingStatus: 'idle',
    selectedStation: null,
    slotStates: {}
  }),

  simulateBooking: async (stationId) => {
    set({ bookingStatus: 'analyzing' });
    await new Promise(resolve => setTimeout(resolve, 1500));
    const station = get().stations.find(s => s.id === stationId);
    if (station?.status === 'critical') {
      set({ bookingStatus: 'conflict' });
    } else {
      set({ bookingStatus: 'confirmed' });
    }
  },

  acceptOptimization: async () => {
      set({ bookingStatus: 'analyzing' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      set({ bookingStatus: 'optimized' });
      await new Promise(resolve => setTimeout(resolve, 800));
      set({ bookingStatus: 'confirmed' });
  },

  initializeSlots: (stationId) => {
      const current = get().slotStates[stationId];
      if (!current) {
          // Generate mock data deterministic based on ID or random
          const total = 10;
          const occupied = Math.floor(Math.random() * 6) + 2; // 2 to 8 occupied
          const available = total - occupied;
          
          set(state => ({
              slotStates: {
                  ...state.slotStates,
                  [stationId]: {
                      totalSlots: total,
                      availableSlots: available,
                      occupiedSlots: occupied,
                      emergencySlots: 2 // Always 2 emergency slots
                  }
              }
          }));
      }
  },

  bookSlot: (stationId, vehicleNumber, isEmergency) => {
      const current = get().slotStates[stationId];
      if (!current) return false;

      if (isEmergency) {
          if (current.emergencySlots > 0) {
              set(state => ({
                  slotStates: {
                      ...state.slotStates,
                      [stationId]: {
                          ...current,
                          emergencySlots: current.emergencySlots - 1
                      }
                  }
              }));
              return true;
          }
      } else {
          if (current.availableSlots > 0) {
              set(state => ({
                  slotStates: {
                      ...state.slotStates,
                      [stationId]: {
                          ...current,
                          availableSlots: current.availableSlots - 1,
                          occupiedSlots: current.occupiedSlots + 1
                      }
                  }
              }));
              return true;
          }
      }
      return false;
  }
}));
