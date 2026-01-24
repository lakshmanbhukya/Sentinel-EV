// Recovery Store - Shared state for recovery progress across components
import { create } from 'zustand';
import type { RecoveryProgress } from '../utils/recoverySimulation';

interface RecoveryState {
  // Active recoveries by station ID
  activeRecoveries: Map<string, RecoveryProgress>;
  
  // Actions
  startRecovery: (stationId: string) => void;
  updateRecoveryProgress: (stationId: string, progress: RecoveryProgress) => void;
  completeRecovery: (stationId: string) => void;
  isRecovering: (stationId: string) => boolean;
  getRecoveryProgress: (stationId: string) => RecoveryProgress | null;
}

export const useRecoveryStore = create<RecoveryState>((set, get) => ({
  activeRecoveries: new Map(),
  
  startRecovery: (stationId) => {
    set(state => {
      const newRecoveries = new Map(state.activeRecoveries);
      newRecoveries.set(stationId, {
        phase: 'critical',
        progress: 0,
        currentTemp: 108,
        currentLoad: 96,
        currentEfficiency: 72,
        currentUptime: 87,
        message: 'Initiating recovery...'
      });
      return { activeRecoveries: newRecoveries };
    });
  },
  
  updateRecoveryProgress: (stationId, progress) => {
    set(state => {
      const newRecoveries = new Map(state.activeRecoveries);
      newRecoveries.set(stationId, progress);
      return { activeRecoveries: newRecoveries };
    });
  },
  
  completeRecovery: (stationId) => {
    set(state => {
      const newRecoveries = new Map(state.activeRecoveries);
      newRecoveries.delete(stationId);
      return { activeRecoveries: newRecoveries };
    });
  },
  
  isRecovering: (stationId) => {
    return get().activeRecoveries.has(stationId);
  },
  
  getRecoveryProgress: (stationId) => {
    return get().activeRecoveries.get(stationId) || null;
  }
}));
