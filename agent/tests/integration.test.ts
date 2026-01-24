// Integration tests for core modules working together
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TelemetrySimulatorImpl } from '../telemetrySimulator.js';
import { FaultDetectorImpl } from '../faultDetector.js';
import { AgentStateManagerImpl } from '../agentState.js';
import { FaultType } from '../types.js';

describe('Core Modules Integration', () => {
  let telemetrySimulator: TelemetrySimulatorImpl;
  let faultDetector: FaultDetectorImpl;
  let stateManager: AgentStateManagerImpl;
  const testStationId = 'integration-test-station';

  beforeEach(() => {
    telemetrySimulator = new TelemetrySimulatorImpl();
    faultDetector = new FaultDetectorImpl();
    stateManager = new AgentStateManagerImpl();
  });

  afterEach(() => {
    telemetrySimulator.stopSimulation(testStationId);
    stateManager.reset(testStationId);
  });

  describe('Telemetry → Fault Detection → State Management Flow', () => {
    it('should detect overvoltage fault and transition agent state correctly', async () => {
      // Start with normal telemetry
      telemetrySimulator.startSimulation(testStationId, 50);
      
      // Verify initial state
      expect(stateManager.getCurrentPhase(testStationId)).toBe('STABLE');
      
      // Generate normal telemetry and verify no faults
      const normalTelemetry = telemetrySimulator.getCurrentTelemetry(testStationId);
      expect(normalTelemetry).not.toBeNull();
      
      if (normalTelemetry) {
        const normalFault = faultDetector.analyzeTelemetry(normalTelemetry);
        expect(normalFault).toBeNull();
      }

      // Inject overvoltage fault
      telemetrySimulator.injectFault(testStationId, 'overvoltage');
      
      // Wait a moment for fault to be applied
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get faulted telemetry
      const faultedTelemetry = telemetrySimulator.getCurrentTelemetry(testStationId);
      expect(faultedTelemetry).not.toBeNull();
      
      if (faultedTelemetry) {
        // Verify fault is detected
        const detectedFault = faultDetector.analyzeTelemetry(faultedTelemetry);
        expect(detectedFault).not.toBeNull();
        expect(detectedFault?.type).toBe('overvoltage');
        
        // Update agent state with detected fault
        if (detectedFault) {
          stateManager.setFault(testStationId, detectedFault);
          
          // Verify state transition
          expect(stateManager.getCurrentPhase(testStationId)).toBe('CRITICAL');
          
          // Verify fault is stored in state
          const agentState = stateManager.getState(testStationId);
          expect(agentState.currentFault).toBeDefined();
          expect(agentState.currentFault?.type).toBe('overvoltage');
          
          // Verify logging
          const logs = stateManager.getLogs(testStationId);
          const faultLog = logs.find(log => log.message.includes('Fault detected'));
          expect(faultLog).toBeDefined();
          expect(faultLog?.level).toBe('warning');
        }
      }
    });

    it('should handle multiple fault types and prioritize correctly', async () => {
      telemetrySimulator.startSimulation(testStationId, 50);
      
      // Inject multiple faults by creating telemetry with multiple issues
      const multiFaultTelemetry = telemetrySimulator.generateNormalTelemetry(testStationId);
      multiFaultTelemetry.voltage = 280; // Overvoltage
      multiFaultTelemetry.current = 45;  // Overcurrent
      multiFaultTelemetry.temperature = 75; // Overtemperature
      
      // Detect faults
      const fault1 = faultDetector.analyzeTelemetry(multiFaultTelemetry);
      expect(fault1).not.toBeNull();
      
      // Should detect the highest priority fault first
      if (fault1) {
        stateManager.setFault(testStationId, fault1);
        
        // Continue detecting other faults
        const fault2 = faultDetector.analyzeTelemetry({
          ...multiFaultTelemetry,
          voltage: 230 // Fix voltage, keep other faults
        });
        
        const fault3 = faultDetector.analyzeTelemetry({
          ...multiFaultTelemetry,
          voltage: 230,
          current: 16 // Fix voltage and current, keep temperature fault
        });
        
        // Get all active faults and verify prioritization
        const activeFaults = faultDetector.getActiveFaults(testStationId);
        expect(activeFaults.length).toBeGreaterThan(0);
        
        // Verify critical faults come before warnings
        for (let i = 0; i < activeFaults.length - 1; i++) {
          const current = activeFaults[i];
          const next = activeFaults[i + 1];
          
          if (current.severity === 'warning' && next.severity === 'critical') {
            throw new Error('Fault prioritization incorrect: warning before critical');
          }
        }
      }
    });

    it('should handle complete fault resolution cycle', async () => {
      telemetrySimulator.startSimulation(testStationId, 50);
      
      // Inject fault
      telemetrySimulator.injectFault(testStationId, 'overcurrent');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Detect fault
      const faultedTelemetry = telemetrySimulator.getCurrentTelemetry(testStationId);
      if (faultedTelemetry) {
        const fault = faultDetector.analyzeTelemetry(faultedTelemetry);
        expect(fault).not.toBeNull();
        
        if (fault) {
          // Update agent state
          stateManager.setFault(testStationId, fault);
          expect(stateManager.getCurrentPhase(testStationId)).toBe('CRITICAL');
          
          // Simulate diagnosis phase
          const success1 = stateManager.transitionTo(testStationId, 'DIAGNOSING', { trigger: 'diagnosis_started' });
          expect(success1).toBe(true);
          expect(stateManager.getCurrentPhase(testStationId)).toBe('DIAGNOSING');
          
          // Simulate execution phase
          const success2 = stateManager.transitionTo(testStationId, 'EXECUTING', { trigger: 'diagnosis_complete' });
          expect(success2).toBe(true);
          expect(stateManager.getCurrentPhase(testStationId)).toBe('EXECUTING');
          
          // Simulate recovery completion
          const success3 = stateManager.transitionTo(testStationId, 'RESOLVED', { trigger: 'recovery_complete' });
          expect(success3).toBe(true);
          expect(stateManager.getCurrentPhase(testStationId)).toBe('RESOLVED');
          
          // Clear fault and return to normal
          telemetrySimulator.clearFault(testStationId);
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Verify fault is resolved
          const normalTelemetry = telemetrySimulator.getCurrentTelemetry(testStationId);
          if (normalTelemetry) {
            const resolvedFault = faultDetector.analyzeTelemetry(normalTelemetry);
            expect(resolvedFault).toBeNull();
          }
          
          // Complete cycle
          const success4 = stateManager.transitionTo(testStationId, 'STABLE', { trigger: 'cycle_complete' });
          expect(success4).toBe(true);
          expect(stateManager.getCurrentPhase(testStationId)).toBe('STABLE');
        }
      }
    });

    it('should maintain performance requirements during integration', async () => {
      telemetrySimulator.startSimulation(testStationId, 50);
      
      // Test multiple cycles to verify performance
      const performanceResults: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        
        // Generate telemetry
        const telemetry = telemetrySimulator.getCurrentTelemetry(testStationId);
        expect(telemetry).not.toBeNull();
        
        if (telemetry) {
          // Analyze for faults
          const fault = faultDetector.analyzeTelemetry(telemetry);
          
          // Update state if needed
          if (fault) {
            stateManager.setFault(testStationId, fault);
          }
        }
        
        const endTime = performance.now();
        const cycleTime = endTime - startTime;
        performanceResults.push(cycleTime);
        
        // Each cycle should be fast
        expect(cycleTime).toBeLessThan(100); // 100ms requirement
        
        // Reset for next iteration
        stateManager.reset(testStationId);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Average performance should be much better than requirement
      const avgTime = performanceResults.reduce((sum, time) => sum + time, 0) / performanceResults.length;
      expect(avgTime).toBeLessThan(50); // Should be much faster than 100ms
    });

    it('should handle concurrent multi-station operations', async () => {
      const stationIds = ['station-1', 'station-2', 'station-3'];
      const faultTypes: FaultType[] = ['overvoltage', 'overcurrent', 'overtemperature'];
      
      // Start simulations for all stations
      stationIds.forEach(stationId => {
        telemetrySimulator.startSimulation(stationId, 50);
      });
      
      // Inject different faults in each station
      stationIds.forEach((stationId, index) => {
        telemetrySimulator.injectFault(stationId, faultTypes[index]);
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify each station has independent state
      for (let i = 0; i < stationIds.length; i++) {
        const stationId = stationIds[i];
        const expectedFaultType = faultTypes[i];
        
        const telemetry = telemetrySimulator.getCurrentTelemetry(stationId);
        expect(telemetry).not.toBeNull();
        
        if (telemetry) {
          const fault = faultDetector.analyzeTelemetry(telemetry);
          expect(fault).not.toBeNull();
          expect(fault?.type).toBe(expectedFaultType);
          
          stateManager.setFault(stationId, fault!);
          expect(stateManager.getCurrentPhase(stationId)).toBe('CRITICAL');
          
          // Verify state isolation
          const agentState = stateManager.getState(stationId);
          expect(agentState.stationId).toBe(stationId);
          expect(agentState.currentFault?.type).toBe(expectedFaultType);
        }
      }
      
      // Verify states are independent
      const states = stationIds.map(id => stateManager.getCurrentPhase(id));
      expect(states.every(state => state === 'CRITICAL')).toBe(true);
      
      // Clean up
      stationIds.forEach(stationId => {
        telemetrySimulator.stopSimulation(stationId);
        stateManager.reset(stationId);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid telemetry data gracefully', () => {
      const invalidTelemetry = {
        stationId: testStationId,
        timestamp: Date.now(),
        voltage: NaN,
        current: -1,
        temperature: Infinity,
        powerOutput: -100,
        connectionStatus: 'connected' as const,
        chargingState: 'charging' as const
      };
      
      // Should not crash on invalid data
      expect(() => {
        const fault = faultDetector.analyzeTelemetry(invalidTelemetry);
        // May or may not detect fault, but should not throw
      }).not.toThrow();
    });

    it('should handle rapid state transitions without corruption', () => {
      // Rapid transitions
      const transitions = [
        { to: 'CRITICAL' as const, trigger: 'fault_detected' },
        { to: 'DIAGNOSING' as const, trigger: 'diagnosis_started' },
        { to: 'EXECUTING' as const, trigger: 'diagnosis_complete' },
        { to: 'RESOLVED' as const, trigger: 'recovery_complete' },
        { to: 'STABLE' as const, trigger: 'cycle_complete' }
      ];
      
      for (const transition of transitions) {
        const success = stateManager.transitionTo(testStationId, transition.to, { trigger: transition.trigger });
        expect(success).toBe(true);
        expect(stateManager.getCurrentPhase(testStationId)).toBe(transition.to);
      }
      
      // Verify logs are consistent
      const logs = stateManager.getLogs(testStationId);
      expect(logs.length).toBeGreaterThan(0);
      
      // Verify chronological order
      for (let i = 1; i < logs.length; i++) {
        expect(logs[i].timestamp).toBeGreaterThanOrEqual(logs[i - 1].timestamp);
      }
    });
  });
});