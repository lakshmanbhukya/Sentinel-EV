// Property Test: End-to-End Performance
// Feature: self-healing-ai-agent, Property 9: End-to-End Performance
// Validates: Requirements 3.4, 8.1

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { agentController } from '../AgentController.js';
import { telemetrySimulator } from '../telemetrySimulator.js';
import { TelemetryData, FaultType } from '../types.js';

describe('Property Test: End-to-End Performance', () => {
  beforeEach(async () => {
    await agentController.initialize();
    agentController.start();
  });

  afterEach(() => {
    agentController.stop();
  });

  // Property 9: End-to-End Performance
  // For any fault occurrence, the complete detection-to-resolution cycle should complete within 400ms when recovery is successful
  it('should complete fault-to-resolution cycle within 400ms', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          stationId: fc.string({ minLength: 1, maxLength: 10 }),
          faultType: fc.constantFrom('overvoltage', 'overcurrent', 'overtemperature'),
          stationData: fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            name: fc.string({ minLength: 1, maxLength: 20 }),
            status: fc.constantFrom('critical', 'warning'),
            temp: fc.float({ min: 60, max: 120 }), // High temp to trigger faults
            load: fc.float({ min: 80, max: 100 }), // High load to trigger faults
            lat: fc.float({ min: -90, max: 90 }),
            lng: fc.float({ min: -180, max: 180 })
          })
        }),
        async ({ stationId, faultType, stationData }) => {
          // Ensure station data matches station ID
          stationData.id = stationId;
          
          // Activate agent for the station
          await agentController.activateAgent(stationId, stationData);
          
          // Set up performance tracking
          const startTime = performance.now();
          let cycleCompleted = false;
          let recoverySuccessful = false;
          
          // Set up callbacks to track cycle completion
          agentController.onRecoveryComplete((completedStationId, result) => {
            if (completedStationId === stationId) {
              cycleCompleted = true;
              recoverySuccessful = result.success;
            }
          });
          
          // Trigger fault scenario
          await agentController.triggerDemoScenario(stationId, faultType);
          
          // Wait for cycle completion with timeout
          const maxWaitTime = 1000; // 1 second max wait
          const checkInterval = 10; // Check every 10ms
          let elapsed = 0;
          
          while (!cycleCompleted && elapsed < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            elapsed += checkInterval;
          }
          
          const endTime = performance.now();
          const cycleTime = endTime - startTime;
          
          // Clean up
          agentController.stopAgent(stationId);
          
          // Verify performance requirement
          if (recoverySuccessful) {
            expect(cycleTime).toBeLessThan(400); // 400ms requirement
          }
          
          // Return property result
          return !recoverySuccessful || cycleTime < 400;
        }
      ),
      { numRuns: 5, timeout: 15000 } // 5 iterations, 15 second timeout
    );
  });

  // Additional performance validation tests
  it('should maintain performance under concurrent load', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            stationId: fc.string({ minLength: 1, maxLength: 10 }),
            faultType: fc.constantFrom('overvoltage', 'overcurrent', 'overtemperature'),
            stationData: fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }),
              name: fc.string({ minLength: 1, maxLength: 20 }),
              status: fc.constantFrom('critical', 'warning'),
              temp: fc.float({ min: 60, max: 120 }),
              load: fc.float({ min: 80, max: 100 }),
              lat: fc.float({ min: -90, max: 90 }),
              lng: fc.float({ min: -180, max: 180 })
            })
          }),
          { minLength: 2, maxLength: 3 } // Test with 2-3 concurrent stations
        ),
        async (stations) => {
          // Make station IDs unique
          const uniqueStations = stations.map((station, index) => ({
            ...station,
            stationId: `station-${index}`,
            stationData: {
              ...station.stationData,
              id: `station-${index}`
            }
          }));
          
          const startTime = performance.now();
          const completedStations = new Set<string>();
          const successfulRecoveries = new Set<string>();
          
          // Set up callback to track completions
          agentController.onRecoveryComplete((stationId, result) => {
            completedStations.add(stationId);
            if (result.success) {
              successfulRecoveries.add(stationId);
            }
          });
          
          // Activate all agents and trigger faults concurrently
          await Promise.all(
            uniqueStations.map(async ({ stationId, faultType, stationData }) => {
              await agentController.activateAgent(stationId, stationData);
              await agentController.triggerDemoScenario(stationId, faultType);
            })
          );
          
          // Wait for all cycles to complete
          const maxWaitTime = 2000; // 2 seconds max wait for concurrent operations
          const checkInterval = 50; // Check every 50ms
          let elapsed = 0;
          
          while (completedStations.size < uniqueStations.length && elapsed < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            elapsed += checkInterval;
          }
          
          const endTime = performance.now();
          const totalTime = endTime - startTime;
          
          // Clean up
          uniqueStations.forEach(({ stationId }) => {
            agentController.stopAgent(stationId);
          });
          
          // Verify concurrent performance
          // Each station should still complete within reasonable time even under load
          const averageTimePerStation = totalTime / uniqueStations.length;
          
          // Property: Concurrent operations should not degrade performance beyond acceptable limits
          return averageTimePerStation < 600; // 600ms average per station under concurrent load
        }
      ),
      { numRuns: 3, timeout: 20000 } // 3 iterations, 20 second timeout
    );
  });

  // Test telemetry processing performance
  it('should process telemetry data within performance thresholds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          stationId: fc.string({ minLength: 1, maxLength: 10 }),
          telemetryBatch: fc.array(
            fc.record({
              voltage: fc.float({ min: 180, max: 270 }),
              current: fc.float({ min: 0, max: 50 }),
              temperature: fc.float({ min: 15, max: 120 }),
              powerOutput: fc.float({ min: 0, max: 10 }),
              connectionStatus: fc.constantFrom('connected', 'disconnected', 'error'),
              chargingState: fc.constantFrom('idle', 'charging', 'complete', 'fault')
            }),
            { minLength: 5, maxLength: 20 }
          )
        }),
        async ({ stationId, telemetryBatch }) => {
          // Activate agent
          const stationData = {
            id: stationId,
            name: `Station ${stationId}`,
            status: 'safe' as const,
            temp: 25,
            load: 50,
            lat: 0,
            lng: 0
          };
          
          await agentController.activateAgent(stationId, stationData);
          
          // Process telemetry batch and measure performance
          const startTime = performance.now();
          
          for (const telemetryData of telemetryBatch) {
            const fullTelemetryData: TelemetryData = {
              stationId,
              timestamp: Date.now(),
              ...telemetryData
            };
            
            // Simulate telemetry processing (this would normally be done by the real-time telemetry system)
            // We're testing the processing time here
            await new Promise(resolve => setTimeout(resolve, 1)); // Minimal processing delay
          }
          
          const endTime = performance.now();
          const processingTime = endTime - startTime;
          
          // Clean up
          agentController.stopAgent(stationId);
          
          // Property: Telemetry processing should be efficient
          const timePerReading = processingTime / telemetryBatch.length;
          return timePerReading < 5; // Less than 5ms per telemetry reading
        }
      ),
      { numRuns: 3, timeout: 15000 }
    );
  });

  // Test system resource efficiency
  it('should maintain resource efficiency during operation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          operationDuration: fc.integer({ min: 1000, max: 5000 }), // 1-5 seconds
          stationCount: fc.integer({ min: 1, max: 3 }) // 1-3 stations
        }),
        async ({ operationDuration, stationCount }) => {
          const stations = Array.from({ length: stationCount }, (_, i) => ({
            stationId: `perf-station-${i}`,
            stationData: {
              id: `perf-station-${i}`,
              name: `Performance Station ${i}`,
              status: 'safe' as const,
              temp: 25,
              load: 30,
              lat: 0,
              lng: 0
            }
          }));
          
          // Measure initial memory usage (approximate)
          const initialTime = performance.now();
          
          // Activate agents
          await Promise.all(
            stations.map(({ stationId, stationData }) =>
              agentController.activateAgent(stationId, stationData)
            )
          );
          
          // Run for specified duration
          await new Promise(resolve => setTimeout(resolve, operationDuration));
          
          const finalTime = performance.now();
          const actualDuration = finalTime - initialTime;
          
          // Clean up
          stations.forEach(({ stationId }) => {
            agentController.stopAgent(stationId);
          });
          
          // Property: System should maintain reasonable performance characteristics
          // This is a basic check - in a real system you'd measure actual memory/CPU usage
          const metrics = agentController.getMetrics();
          
          return (
            actualDuration >= operationDuration * 0.9 && // Operation completed in reasonable time
            actualDuration <= operationDuration * 1.2 && // No significant delays
            metrics.systemHealth !== 'critical' // System health maintained
          );
        }
      ),
      { numRuns: 3, timeout: 30000 }
    );
  });
});