// Telemetry Simulator for Self-Healing AI Agent
// Generates realistic charging station telemetry data with controllable fault injection

import { TelemetryData, FaultType } from './types.js';

export interface TelemetrySimulator {
  generateNormalTelemetry(stationId: string): TelemetryData;
  injectFault(stationId: string, faultType: FaultType): void;
  startSimulation(stationId: string, intervalMs: number): void;
  stopSimulation(stationId: string): void;
  getCurrentTelemetry(stationId: string): TelemetryData | null;
}

interface SimulationState {
  stationId: string;
  intervalId?: ReturnType<typeof setInterval>;
  currentData: TelemetryData;
  faultInjected?: FaultType;
  transitionProgress: number; // 0-1 for smooth transitions
  targetValues?: Partial<TelemetryData>;
}

export class TelemetrySimulatorImpl implements TelemetrySimulator {
  private simulations = new Map<string, SimulationState>();
  private callbacks = new Map<string, (data: TelemetryData) => void>();

  // Normal operational ranges based on requirements
  private readonly NORMAL_RANGES = {
    voltage: { min: 200, max: 250, nominal: 230 },
    current: { min: 0, max: 32, nominal: 16 },
    temperature: { min: 20, max: 40, nominal: 25 },
    powerOutput: { min: 0, max: 7.4, nominal: 3.7 }
  };

  // Fault injection parameters
  private readonly FAULT_PARAMETERS = {
    overvoltage: { voltage: 280 },
    undervoltage: { voltage: 180 },
    overcurrent: { current: 45 },
    overtemperature: { temperature: 75 },
    connection_lost: { connectionStatus: 'error' as const },
    charging_stalled: { current: 0, chargingState: 'fault' as const }
  };

  generateNormalTelemetry(stationId: string): TelemetryData {
    const now = Date.now();
    
    // Add small random variations to make data realistic
    const voltageVariation = (Math.random() - 0.5) * 10; // ±5V variation
    const currentVariation = (Math.random() - 0.5) * 4;  // ±2A variation
    const tempVariation = (Math.random() - 0.5) * 6;     // ±3°C variation
    
    return {
      stationId,
      timestamp: now,
      voltage: this.NORMAL_RANGES.voltage.nominal + voltageVariation,
      current: Math.max(0, this.NORMAL_RANGES.current.nominal + currentVariation),
      temperature: this.NORMAL_RANGES.temperature.nominal + tempVariation,
      powerOutput: Math.max(0, this.NORMAL_RANGES.powerOutput.nominal + (currentVariation * 0.23)), // P = V * I / 1000
      connectionStatus: 'connected',
      chargingState: 'charging'
    };
  }

  injectFault(stationId: string, faultType: FaultType): void {
    const simulation = this.simulations.get(stationId);
    if (!simulation) {
      throw new Error(`No simulation running for station ${stationId}`);
    }

    simulation.faultInjected = faultType;
    simulation.transitionProgress = 0;
    
    // Set target values for smooth transition to fault state
    const faultParams = this.FAULT_PARAMETERS[faultType];
    simulation.targetValues = { ...faultParams };
    
    // For connection_lost and charging_stalled, transition immediately
    if (faultType === 'connection_lost' || faultType === 'charging_stalled') {
      simulation.transitionProgress = 1;
      this.applyFaultToTelemetry(simulation);
    }
  }

  startSimulation(stationId: string, intervalMs: number = 100): void {
    // Stop existing simulation if running
    this.stopSimulation(stationId);

    const initialData = this.generateNormalTelemetry(stationId);
    const simulation: SimulationState = {
      stationId,
      currentData: initialData,
      transitionProgress: 1,
    };

    this.simulations.set(stationId, simulation);

    // Start periodic telemetry generation
    simulation.intervalId = setInterval(() => {
      this.updateSimulation(simulation);
      
      // Notify callbacks if registered
      const callback = this.callbacks.get(stationId);
      if (callback) {
        callback(simulation.currentData);
      }
    }, intervalMs);
  }

  stopSimulation(stationId: string): void {
    const simulation = this.simulations.get(stationId);
    if (simulation?.intervalId) {
      clearInterval(simulation.intervalId);
    }
    this.simulations.delete(stationId);
    this.callbacks.delete(stationId);
  }

  getCurrentTelemetry(stationId: string): TelemetryData | null {
    const simulation = this.simulations.get(stationId);
    return simulation ? { ...simulation.currentData } : null;
  }

  // Register callback for telemetry updates
  onTelemetryUpdate(stationId: string, callback: (data: TelemetryData) => void): void {
    this.callbacks.set(stationId, callback);
  }

  // Clear any injected faults and return to normal operation
  clearFault(stationId: string): void {
    const simulation = this.simulations.get(stationId);
    if (simulation) {
      simulation.faultInjected = undefined;
      simulation.targetValues = undefined;
      simulation.transitionProgress = 0;
    }
  }

  private updateSimulation(simulation: SimulationState): void {
    const now = Date.now();
    
    if (simulation.faultInjected && simulation.targetValues) {
      // Smooth transition to fault state
      if (simulation.transitionProgress < 1) {
        simulation.transitionProgress = Math.min(1, simulation.transitionProgress + 0.1);
        this.interpolateToTarget(simulation);
      } else {
        this.applyFaultToTelemetry(simulation);
      }
    } else {
      // Generate normal telemetry with small variations
      const newData = this.generateNormalTelemetry(simulation.stationId);
      simulation.currentData = {
        ...newData,
        timestamp: now
      };
    }
    
    // Update timestamp
    simulation.currentData.timestamp = now;
  }

  private interpolateToTarget(simulation: SimulationState): void {
    if (!simulation.targetValues) return;

    const progress = simulation.transitionProgress;
    const current = simulation.currentData;
    const target = simulation.targetValues;

    // Smoothly interpolate numeric values
    if (target.voltage !== undefined) {
      const startVoltage = this.NORMAL_RANGES.voltage.nominal;
      current.voltage = startVoltage + (target.voltage - startVoltage) * progress;
    }
    
    if (target.current !== undefined) {
      const startCurrent = this.NORMAL_RANGES.current.nominal;
      current.current = startCurrent + (target.current - startCurrent) * progress;
    }
    
    if (target.temperature !== undefined) {
      const startTemp = this.NORMAL_RANGES.temperature.nominal;
      current.temperature = startTemp + (target.temperature - startTemp) * progress;
    }

    // Update power output based on current values
    current.powerOutput = (current.voltage * current.current) / 1000;

    // Apply discrete state changes when transition is complete
    if (progress >= 1) {
      if (target.connectionStatus) {
        current.connectionStatus = target.connectionStatus;
      }
      if (target.chargingState) {
        current.chargingState = target.chargingState;
      }
    }
  }

  private applyFaultToTelemetry(simulation: SimulationState): void {
    if (!simulation.faultInjected || !simulation.targetValues) return;

    const current = simulation.currentData;
    const target = simulation.targetValues;

    // Apply target values with small random variations to maintain realism
    if (target.voltage !== undefined) {
      current.voltage = target.voltage + (Math.random() - 0.5) * 5;
    }
    
    if (target.current !== undefined) {
      current.current = Math.max(0, target.current + (Math.random() - 0.5) * 2);
    }
    
    if (target.temperature !== undefined) {
      current.temperature = target.temperature + (Math.random() - 0.5) * 3;
    }

    if (target.connectionStatus) {
      current.connectionStatus = target.connectionStatus;
    }
    
    if (target.chargingState) {
      current.chargingState = target.chargingState;
    }

    // Update power output
    if (current.connectionStatus === 'connected' && current.chargingState !== 'fault') {
      current.powerOutput = (current.voltage * current.current) / 1000;
    } else {
      current.powerOutput = 0;
    }
  }
}

// Export singleton instance for convenience
export const telemetrySimulator = new TelemetrySimulatorImpl();