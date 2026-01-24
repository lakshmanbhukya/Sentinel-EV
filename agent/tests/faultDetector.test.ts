// Property-based tests for Fault Detector
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { FaultDetectorImpl } from '../faultDetector.js';
import { TelemetryData, FaultType, FaultThresholds } from '../types.js';

describe('Fault Detector Property Tests', () => {
  let detector: FaultDetectorImpl;

  beforeEach(() => {
    detector = new FaultDetectorImpl();
  });

  // Property 1: Fault Detection Performance and Accuracy
  // Validates: Requirements 1.1, 1.4
  describe('Property 1: Fault Detection Performance and Accuracy', () => {
    it('should detect faults within 100ms and classify correct fault types for anomalous telemetry', () => {
      // Feature: self-healing-ai-agent, Property 1: Fault Detection Performance and Accuracy
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // Station ID
          fc.record({
            voltage: fc.oneof(
              fc.float({ min: 50, max: 199 }), // Undervoltage
              fc.float({ min: 251, max: 400 }) // Overvoltage
            ),
            current: fc.oneof(
              fc.float({ min: 0, max: 32 }), // Normal current
              fc.float({ min: 33, max: 100 }) // Overcurrent
            ),
            temperature: fc.oneof(
              fc.float({ min: 10, max: 60 }), // Normal temperature
              fc.float({ min: 61, max: 100 }) // Overtemperature
            ),
            connectionStatus: fc.constantFrom('connected', 'error'),
            chargingState: fc.constantFrom('charging', 'fault')
          }),
          (stationId, anomalousValues) => {
            const telemetryData: TelemetryData = {
              stationId,
              timestamp: Date.now(),
              voltage: anomalousValues.voltage,
              current: anomalousValues.current,
              temperature: anomalousValues.temperature,
              powerOutput: (anomalousValues.voltage * anomalousValues.current) / 1000,
              connectionStatus: anomalousValues.connectionStatus,
              chargingState: anomalousValues.chargingState
            };

            const startTime = performance.now();
            const fault = detector.analyzeTelemetry(telemetryData);
            const endTime = performance.now();

            // Performance requirement: detection within 100ms (Requirement 1.1)
            const detectionTime = endTime - startTime;
            expect(detectionTime).toBeLessThan(100);

            // Accuracy requirement: should detect fault for anomalous conditions (Requirement 1.4)
            const shouldDetectFault = 
              anomalousValues.voltage < 200 || anomalousValues.voltage > 250 ||
              anomalousValues.current > 32 ||
              anomalousValues.temperature > 60 ||
              anomalousValues.connectionStatus === 'error' ||
              anomalousValues.chargingState === 'fault';

            if (shouldDetectFault) {
              expect(fault).not.toBeNull();
              
              if (fault) {
                // Verify correct fault type classification
                if (anomalousValues.voltage > 250) {
                  expect(fault.type).toBe('overvoltage');
                } else if (anomalousValues.voltage < 200) {
                  expect(fault.type).toBe('undervoltage');
                } else if (anomalousValues.current > 32) {
                  expect(fault.type).toBe('overcurrent');
                } else if (anomalousValues.temperature > 60) {
                  expect(fault.type).toBe('overtemperature');
                } else if (anomalousValues.connectionStatus === 'error') {
                  expect(fault.type).toBe('connection_lost');
                } else if (anomalousValues.chargingState === 'fault') {
                  expect(fault.type).toBe('charging_stalled');
                }

                // Verify fault structure
                expect(fault.stationId).toBe(stationId);
                expect(fault.severity).toMatch(/^(warning|critical)$/);
                expect(typeof fault.description).toBe('string');
                expect(fault.description.length).toBeGreaterThan(0);
              }
            }

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should not detect faults for normal telemetry within operational ranges', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.record({
            voltage: fc.float({ min: 200, max: 250 }),
            current: fc.float({ min: 0, max: 32 }),
            temperature: fc.float({ min: 20, max: 60 })
          }),
          (stationId, normalValues) => {
            const telemetryData: TelemetryData = {
              stationId,
              timestamp: Date.now(),
              voltage: normalValues.voltage,
              current: normalValues.current,
              temperature: normalValues.temperature,
              powerOutput: (normalValues.voltage * normalValues.current) / 1000,
              connectionStatus: 'connected',
              chargingState: 'charging'
            };

            const startTime = performance.now();
            const fault = detector.analyzeTelemetry(telemetryData);
            const endTime = performance.now();

            // Should still be fast for normal telemetry
            expect(endTime - startTime).toBeLessThan(100);

            // Should not detect any faults for normal values
            expect(fault).toBeNull();

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
  // Property 2: Fault Prioritization
  // Validates: Requirements 1.2
  describe('Property 2: Fault Prioritization', () => {
    it('should prioritize critical faults over warning-level issues when multiple faults occur', () => {
      // Feature: self-healing-ai-agent, Property 2: Fault Prioritization
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.array(
            fc.record({
              faultType: fc.constantFrom('overvoltage', 'undervoltage', 'overcurrent', 'overtemperature', 'connection_lost', 'charging_stalled'),
              severity: fc.constantFrom('warning', 'critical')
            }),
            { minLength: 2, maxLength: 4 }
          ),
          (stationId, faultScenarios) => {
            // Create telemetry that triggers multiple faults
            const baseTelemetry: TelemetryData = {
              stationId,
              timestamp: Date.now(),
              voltage: 230,
              current: 16,
              temperature: 25,
              powerOutput: 3.7,
              connectionStatus: 'connected',
              chargingState: 'charging'
            };

            // Inject multiple faults by analyzing separate telemetry instances
            const detectedFaults: Array<{ type: FaultType; severity: 'warning' | 'critical' }> = [];

            for (const scenario of faultScenarios) {
              const faultTelemetry = { ...baseTelemetry };
              
              // Modify telemetry to trigger specific fault with desired severity
              switch (scenario.faultType) {
                case 'overvoltage':
                  faultTelemetry.voltage = scenario.severity === 'critical' ? 280 : 260;
                  break;
                case 'undervoltage':
                  faultTelemetry.voltage = scenario.severity === 'critical' ? 170 : 190;
                  break;
                case 'overcurrent':
                  faultTelemetry.current = scenario.severity === 'critical' ? 45 : 35;
                  break;
                case 'overtemperature':
                  faultTelemetry.temperature = scenario.severity === 'critical' ? 75 : 65;
                  break;
                case 'connection_lost':
                  faultTelemetry.connectionStatus = 'error';
                  break;
                case 'charging_stalled':
                  faultTelemetry.chargingState = 'fault';
                  break;
              }

              const fault = detector.analyzeTelemetry(faultTelemetry);
              if (fault) {
                detectedFaults.push({ type: fault.type, severity: fault.severity });
              }
            }

            // Get all active faults for prioritization testing
            const activeFaults = detector.getActiveFaults(stationId);
            
            if (activeFaults.length > 1) {
              // Verify prioritization: critical faults should come before warning faults
              for (let i = 0; i < activeFaults.length - 1; i++) {
                const currentFault = activeFaults[i];
                const nextFault = activeFaults[i + 1];
                
                // If current fault is warning and next is critical, prioritization is wrong
                const prioritizationCorrect = !(
                  currentFault.severity === 'warning' && nextFault.severity === 'critical'
                );
                expect(prioritizationCorrect).toBe(true);
              }

              // Verify that critical faults appear first in the list
              const criticalFaults = activeFaults.filter(f => f.severity === 'critical');
              const warningFaults = activeFaults.filter(f => f.severity === 'warning');
              
              if (criticalFaults.length > 0 && warningFaults.length > 0) {
                const firstCriticalIndex = activeFaults.findIndex(f => f.severity === 'critical');
                const firstWarningIndex = activeFaults.findIndex(f => f.severity === 'warning');
                
                expect(firstCriticalIndex).toBeLessThan(firstWarningIndex);
              }
            }

            // Clean up for next test
            detector.clearFaults(stationId);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain consistent fault type priority ordering within same severity level', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.shuffledSubarray(['connection_lost', 'overtemperature', 'overcurrent', 'overvoltage', 'undervoltage', 'charging_stalled'], { minLength: 2, maxLength: 4 }),
          (stationId, faultTypes) => {
            const baseTelemetry: TelemetryData = {
              stationId,
              timestamp: Date.now(),
              voltage: 230,
              current: 16,
              temperature: 25,
              powerOutput: 3.7,
              connectionStatus: 'connected',
              chargingState: 'charging'
            };

            // Inject faults in random order
            for (const faultType of faultTypes) {
              const faultTelemetry = { ...baseTelemetry, timestamp: Date.now() + Math.random() * 1000 };
              
              switch (faultType) {
                case 'connection_lost':
                  faultTelemetry.connectionStatus = 'error';
                  break;
                case 'overtemperature':
                  faultTelemetry.temperature = 75;
                  break;
                case 'overcurrent':
                  faultTelemetry.current = 45;
                  break;
                case 'overvoltage':
                  faultTelemetry.voltage = 280;
                  break;
                case 'undervoltage':
                  faultTelemetry.voltage = 170;
                  break;
                case 'charging_stalled':
                  faultTelemetry.chargingState = 'fault';
                  break;
              }

              detector.analyzeTelemetry(faultTelemetry);
            }

            const activeFaults = detector.getActiveFaults(stationId);
            
            // Verify expected priority order: connection_lost > overtemperature > overcurrent > overvoltage > undervoltage > charging_stalled
            const expectedOrder: FaultType[] = ['connection_lost', 'overtemperature', 'overcurrent', 'overvoltage', 'undervoltage', 'charging_stalled'];
            
            if (activeFaults.length > 1) {
              for (let i = 0; i < activeFaults.length - 1; i++) {
                const currentType = activeFaults[i].type;
                const nextType = activeFaults[i + 1].type;
                
                const currentPriority = expectedOrder.indexOf(currentType);
                const nextPriority = expectedOrder.indexOf(nextType);
                
                // Current fault should have higher or equal priority (lower index)
                expect(currentPriority).toBeLessThanOrEqual(nextPriority);
              }
            }

            detector.clearFaults(stationId);
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
  // Unit Tests for Specific Fault Scenarios
  // Tests boundary conditions and edge cases for each threshold type
  describe('Unit Tests: Specific Fault Scenarios', () => {
    describe('Voltage Fault Detection', () => {
      it('should detect overvoltage at exact threshold boundary', () => {
        const telemetry: TelemetryData = {
          stationId: 'test-station',
          timestamp: Date.now(),
          voltage: 250.1, // Just above threshold
          current: 16,
          temperature: 25,
          powerOutput: 4.0,
          connectionStatus: 'connected',
          chargingState: 'charging'
        };

        const fault = detector.analyzeTelemetry(telemetry);
        expect(fault).not.toBeNull();
        expect(fault?.type).toBe('overvoltage');
        expect(fault?.severity).toBe('warning'); // Should be warning level at this voltage
      });

      it('should detect critical overvoltage at high levels', () => {
        const telemetry: TelemetryData = {
          stationId: 'test-station',
          timestamp: Date.now(),
          voltage: 275, // Critical level
          current: 16,
          temperature: 25,
          powerOutput: 4.4,
          connectionStatus: 'connected',
          chargingState: 'charging'
        };

        const fault = detector.analyzeTelemetry(telemetry);
        expect(fault).not.toBeNull();
        expect(fault?.type).toBe('overvoltage');
        expect(fault?.severity).toBe('critical');
      });

      it('should detect undervoltage at exact threshold boundary', () => {
        const telemetry: TelemetryData = {
          stationId: 'test-station',
          timestamp: Date.now(),
          voltage: 199.9, // Just below threshold
          current: 16,
          temperature: 25,
          powerOutput: 3.2,
          connectionStatus: 'connected',
          chargingState: 'charging'
        };

        const fault = detector.analyzeTelemetry(telemetry);
        expect(fault).not.toBeNull();
        expect(fault?.type).toBe('undervoltage');
        expect(fault?.severity).toBe('warning');
      });

      it('should not detect fault at exact threshold values', () => {
        const upperBoundary: TelemetryData = {
          stationId: 'test-station',
          timestamp: Date.now(),
          voltage: 250.0, // Exactly at upper threshold
          current: 16,
          temperature: 25,
          powerOutput: 4.0,
          connectionStatus: 'connected',
          chargingState: 'charging'
        };

        const lowerBoundary: TelemetryData = {
          stationId: 'test-station-2',
          timestamp: Date.now(),
          voltage: 200.0, // Exactly at lower threshold
          current: 16,
          temperature: 25,
          powerOutput: 3.2,
          connectionStatus: 'connected',
          chargingState: 'charging'
        };

        expect(detector.analyzeTelemetry(upperBoundary)).toBeNull();
        expect(detector.analyzeTelemetry(lowerBoundary)).toBeNull();
      });
    });

    describe('Current Fault Detection', () => {
      it('should detect overcurrent at exact threshold boundary', () => {
        const telemetry: TelemetryData = {
          stationId: 'test-station',
          timestamp: Date.now(),
          voltage: 230,
          current: 32.1, // Just above threshold
          temperature: 25,
          powerOutput: 7.4,
          connectionStatus: 'connected',
          chargingState: 'charging'
        };

        const fault = detector.analyzeTelemetry(telemetry);
        expect(fault).not.toBeNull();
        expect(fault?.type).toBe('overcurrent');
        expect(fault?.severity).toBe('warning');
      });

      it('should detect critical overcurrent at high levels', () => {
        const telemetry: TelemetryData = {
          stationId: 'test-station',
          timestamp: Date.now(),
          voltage: 230,
          current: 45, // Critical level
          temperature: 25,
          powerOutput: 10.4,
          connectionStatus: 'connected',
          chargingState: 'charging'
        };

        const fault = detector.analyzeTelemetry(telemetry);
        expect(fault).not.toBeNull();
        expect(fault?.type).toBe('overcurrent');
        expect(fault?.severity).toBe('critical');
      });

      it('should not detect fault at maximum allowed current', () => {
        const telemetry: TelemetryData = {
          stationId: 'test-station',
          timestamp: Date.now(),
          voltage: 230,
          current: 32.0, // Exactly at threshold
          temperature: 25,
          powerOutput: 7.4,
          connectionStatus: 'connected',
          chargingState: 'charging'
        };

        expect(detector.analyzeTelemetry(telemetry)).toBeNull();
      });
    });

    describe('Temperature Fault Detection', () => {
      it('should detect overtemperature at exact threshold boundary', () => {
        const telemetry: TelemetryData = {
          stationId: 'test-station',
          timestamp: Date.now(),
          voltage: 230,
          current: 16,
          temperature: 60.1, // Just above threshold
          powerOutput: 3.7,
          connectionStatus: 'connected',
          chargingState: 'charging'
        };

        const fault = detector.analyzeTelemetry(telemetry);
        expect(fault).not.toBeNull();
        expect(fault?.type).toBe('overtemperature');
        expect(fault?.severity).toBe('warning');
      });

      it('should detect critical overtemperature at dangerous levels', () => {
        const telemetry: TelemetryData = {
          stationId: 'test-station',
          timestamp: Date.now(),
          voltage: 230,
          current: 16,
          temperature: 75, // Critical level
          powerOutput: 3.7,
          connectionStatus: 'connected',
          chargingState: 'charging'
        };

        const fault = detector.analyzeTelemetry(telemetry);
        expect(fault).not.toBeNull();
        expect(fault?.type).toBe('overtemperature');
        expect(fault?.severity).toBe('critical');
      });
    });

    describe('Connection and Charging State Faults', () => {
      it('should detect connection lost fault', () => {
        const telemetry: TelemetryData = {
          stationId: 'test-station',
          timestamp: Date.now(),
          voltage: 230,
          current: 16,
          temperature: 25,
          powerOutput: 3.7,
          connectionStatus: 'error',
          chargingState: 'charging'
        };

        const fault = detector.analyzeTelemetry(telemetry);
        expect(fault).not.toBeNull();
        expect(fault?.type).toBe('connection_lost');
        expect(fault?.severity).toBe('critical');
      });

      it('should detect charging stalled fault when charging state is fault', () => {
        const telemetry: TelemetryData = {
          stationId: 'test-station',
          timestamp: Date.now(),
          voltage: 230,
          current: 16,
          temperature: 25,
          powerOutput: 3.7,
          connectionStatus: 'connected',
          chargingState: 'fault'
        };

        const fault = detector.analyzeTelemetry(telemetry);
        expect(fault).not.toBeNull();
        expect(fault?.type).toBe('charging_stalled');
        expect(fault?.severity).toBe('critical');
      });

      it('should detect charging stalled when current is zero during charging', () => {
        const telemetry: TelemetryData = {
          stationId: 'test-station',
          timestamp: Date.now(),
          voltage: 230,
          current: 0, // No current during charging
          temperature: 25,
          powerOutput: 0,
          connectionStatus: 'connected',
          chargingState: 'charging'
        };

        const fault = detector.analyzeTelemetry(telemetry);
        expect(fault).not.toBeNull();
        expect(fault?.type).toBe('charging_stalled');
        expect(fault?.severity).toBe('critical');
      });
    });

    describe('Fault Resolution', () => {
      it('should clear resolved faults when conditions return to normal', () => {
        const stationId = 'test-station';
        
        // First, trigger an overvoltage fault
        const faultTelemetry: TelemetryData = {
          stationId,
          timestamp: Date.now(),
          voltage: 260,
          current: 16,
          temperature: 25,
          powerOutput: 4.2,
          connectionStatus: 'connected',
          chargingState: 'charging'
        };

        const fault = detector.analyzeTelemetry(faultTelemetry);
        expect(fault).not.toBeNull();
        expect(fault?.type).toBe('overvoltage');

        // Verify fault is active
        expect(detector.getActiveFaults(stationId)).toHaveLength(1);

        // Now provide normal telemetry
        const normalTelemetry: TelemetryData = {
          stationId,
          timestamp: Date.now(),
          voltage: 230, // Back to normal
          current: 16,
          temperature: 25,
          powerOutput: 3.7,
          connectionStatus: 'connected',
          chargingState: 'charging'
        };

        const normalResult = detector.analyzeTelemetry(normalTelemetry);
        expect(normalResult).toBeNull();

        // Fault should be cleared
        expect(detector.getActiveFaults(stationId)).toHaveLength(0);
      });
    });

    describe('Custom Thresholds', () => {
      it('should respect custom thresholds when set', () => {
        const stationId = 'test-station';
        const customThresholds = {
          voltage: { min: 220, max: 240 }, // Tighter voltage range
          current: { max: 25 }, // Lower current limit
          temperature: { max: 50 }, // Lower temperature limit
          responseTime: 100
        };

        detector.setThresholds(stationId, customThresholds);

        const telemetry: TelemetryData = {
          stationId,
          timestamp: Date.now(),
          voltage: 245, // Would be normal with default thresholds, fault with custom
          current: 30, // Would be normal with default thresholds, fault with custom
          temperature: 55, // Would be normal with default thresholds, fault with custom
          powerOutput: 7.4,
          connectionStatus: 'connected',
          chargingState: 'charging'
        };

        const fault = detector.analyzeTelemetry(telemetry);
        expect(fault).not.toBeNull();
        // Should detect the highest priority fault (voltage comes before current in priority)
        expect(fault?.type).toBe('overvoltage');
      });
    });
  });
});