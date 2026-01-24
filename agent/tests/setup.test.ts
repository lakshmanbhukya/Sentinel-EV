// Basic setup test to verify fast-check and vitest integration
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Import core types to verify they're properly exported
import { 
  AgentState, 
  TelemetryData, 
  FaultEvent, 
  DiagnosisResult, 
  RecoveryResult,
  FaultType 
} from '../types.js';

describe('Agent System Setup', () => {
  it('should have all core types available', () => {
    // Verify types are properly exported by creating type guards
    const isValidFaultType = (type: string): type is FaultType => {
      return ['overvoltage', 'undervoltage', 'overcurrent', 'overtemperature', 'connection_lost', 'charging_stalled'].includes(type);
    };

    expect(isValidFaultType('overvoltage')).toBe(true);
    expect(isValidFaultType('invalid')).toBe(false);
  });

  it('should support property-based testing with fast-check', () => {
    // Simple property test to verify fast-check is working
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a; // Commutative property of addition
      }),
      { numRuns: 100 }
    );
  });

  it('should validate AgentState structure', () => {
    // Test that we can create valid AgentState objects
    const mockAgentState: AgentState = {
      phase: 'STABLE',
      stationId: 'test-station-1',
      startTime: Date.now(),
      logs: []
    };

    expect(mockAgentState.phase).toBe('STABLE');
    expect(mockAgentState.stationId).toBe('test-station-1');
    expect(Array.isArray(mockAgentState.logs)).toBe(true);
  });

  it('should validate TelemetryData structure', () => {
    // Test that we can create valid TelemetryData objects
    const mockTelemetry: TelemetryData = {
      stationId: 'test-station-1',
      timestamp: Date.now(),
      voltage: 230,
      current: 16,
      temperature: 25,
      powerOutput: 3.7,
      connectionStatus: 'connected',
      chargingState: 'charging'
    };

    expect(mockTelemetry.voltage).toBe(230);
    expect(mockTelemetry.connectionStatus).toBe('connected');
    expect(mockTelemetry.chargingState).toBe('charging');
  });
});