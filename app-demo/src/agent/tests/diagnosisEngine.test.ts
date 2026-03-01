// Property-based tests for Diagnosis Engine
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { DiagnosisEngineImpl } from '../diagnosisEngine.js';
import { FaultEvent, TelemetryData, FaultType } from '../types.js';

describe('Diagnosis Engine Property Tests', () => {
  let diagnosisEngine: DiagnosisEngineImpl;

  beforeEach(() => {
    diagnosisEngine = new DiagnosisEngineImpl();
  });

  // Property 5: Diagnosis Completeness
  // Validates: Requirements 2.1, 2.4
  describe('Property 5: Diagnosis Completeness', () => {
    it('should produce structured diagnosis result with root cause, confidence, and actions for any detected fault', () => {
      // Feature: self-healing-ai-agent, Property 5: Diagnosis Completeness
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // Station ID
          fc.constantFrom('overvoltage', 'undervoltage', 'overcurrent', 'overtemperature', 'connection_lost', 'charging_stalled'), // Fault type
          fc.constantFrom('warning', 'critical'), // Severity
          fc.array(
            fc.record({
              voltage: fc.float({ min: 180, max: 300 }),
              current: fc.float({ min: 0, max: 50 }),
              temperature: fc.float({ min: 15, max: 80 }),
              connectionStatus: fc.constantFrom('connected', 'disconnected', 'error'),
              chargingState: fc.constantFrom('idle', 'charging', 'complete', 'fault')
            }),
            { minLength: 0, maxLength: 10 }
          ),
          (stationId, faultType, severity, telemetryHistory) => {
            // Create mock fault event
            const mockFault: FaultEvent = {
              id: `fault-${Date.now()}`,
              stationId,
              type: faultType as FaultType,
              severity: severity as 'warning' | 'critical',
              detectedAt: Date.now(),
              telemetrySnapshot: {
                stationId,
                timestamp: Date.now(),
                voltage: faultType === 'overvoltage' ? 280 : faultType === 'undervoltage' ? 180 : 230,
                current: faultType === 'overcurrent' ? 45 : 16,
                temperature: faultType === 'overtemperature' ? 75 : 25,
                powerOutput: 3.7,
                connectionStatus: faultType === 'connection_lost' ? 'error' : 'connected',
                chargingState: faultType === 'charging_stalled' ? 'fault' : 'charging'
              },
              description: `${faultType} fault detected`
            };

            // Create telemetry history
            const history: TelemetryData[] = telemetryHistory.map((data, index) => ({
              stationId,
              timestamp: Date.now() - (telemetryHistory.length - index) * 1000,
              voltage: data.voltage,
              current: data.current,
              temperature: data.temperature,
              powerOutput: (data.voltage * data.current) / 1000,
              connectionStatus: data.connectionStatus,
              chargingState: data.chargingState
            }));

            // Perform diagnosis
            const diagnosis = diagnosisEngine.diagnose(mockFault, history);

            // Verify diagnosis completeness (Requirements 2.1, 2.4)
            expect(diagnosis).toBeDefined();
            expect(diagnosis.faultId).toBe(mockFault.id);
            
            // Root cause should be provided
            expect(diagnosis.rootCause).toBeTypeOf('string');
            expect(diagnosis.rootCause.length).toBeGreaterThan(0);
            
            // Confidence should be between 0 and 1
            expect(diagnosis.confidence).toBeTypeOf('number');
            expect(diagnosis.confidence).toBeGreaterThanOrEqual(0);
            expect(diagnosis.confidence).toBeLessThanOrEqual(1);
            
            // Reasoning should be provided as array of strings
            expect(Array.isArray(diagnosis.reasoning)).toBe(true);
            expect(diagnosis.reasoning.length).toBeGreaterThan(0);
            diagnosis.reasoning.forEach(reason => {
              expect(typeof reason).toBe('string');
              expect(reason.length).toBeGreaterThan(0);
            });
            
            // Recommended actions should be provided
            expect(Array.isArray(diagnosis.recommendedActions)).toBe(true);
            expect(diagnosis.recommendedActions.length).toBeGreaterThan(0);
            diagnosis.recommendedActions.forEach(action => {
              expect(typeof action).toBe('string');
              expect(action.length).toBeGreaterThan(0);
            });
            
            // Estimated recovery time should be positive
            expect(diagnosis.estimatedRecoveryTime).toBeTypeOf('number');
            expect(diagnosis.estimatedRecoveryTime).toBeGreaterThan(0);
            expect(diagnosis.estimatedRecoveryTime).toBeLessThan(10000); // Reasonable upper bound

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should provide consistent diagnosis structure regardless of telemetry history length', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('overvoltage', 'undervoltage', 'overcurrent', 'overtemperature', 'connection_lost', 'charging_stalled'),
          fc.integer({ min: 0, max: 20 }), // History length
          (stationId, faultType, historyLength) => {
            const mockFault: FaultEvent = {
              id: `fault-${Date.now()}`,
              stationId,
              type: faultType as FaultType,
              severity: 'warning',
              detectedAt: Date.now(),
              telemetrySnapshot: {
                stationId,
                timestamp: Date.now(),
                voltage: 230,
                current: 16,
                temperature: 25,
                powerOutput: 3.7,
                connectionStatus: 'connected',
                chargingState: 'charging'
              },
              description: `${faultType} fault detected`
            };

            // Generate history of specified length
            const history: TelemetryData[] = Array.from({ length: historyLength }, (_, index) => ({
              stationId,
              timestamp: Date.now() - (historyLength - index) * 1000,
              voltage: 230 + (Math.random() - 0.5) * 10,
              current: 16 + (Math.random() - 0.5) * 4,
              temperature: 25 + (Math.random() - 0.5) * 6,
              powerOutput: 3.7,
              connectionStatus: 'connected',
              chargingState: 'charging'
            }));

            const diagnosis = diagnosisEngine.diagnose(mockFault, history);

            // Should always provide complete diagnosis regardless of history length
            expect(diagnosis.faultId).toBe(mockFault.id);
            expect(typeof diagnosis.rootCause).toBe('string');
            expect(diagnosis.rootCause.length).toBeGreaterThan(0);
            expect(typeof diagnosis.confidence).toBe('number');
            expect(diagnosis.confidence).toBeGreaterThan(0);
            expect(Array.isArray(diagnosis.reasoning)).toBe(true);
            expect(diagnosis.reasoning.length).toBeGreaterThan(0);
            expect(Array.isArray(diagnosis.recommendedActions)).toBe(true);
            expect(diagnosis.recommendedActions.length).toBeGreaterThan(0);
            expect(typeof diagnosis.estimatedRecoveryTime).toBe('number');
            expect(diagnosis.estimatedRecoveryTime).toBeGreaterThan(0);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should provide fault-type-specific diagnosis with appropriate confidence levels', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('overvoltage', 'undervoltage', 'overcurrent', 'overtemperature', 'connection_lost', 'charging_stalled'),
          (stationId, faultType) => {
            // Create fault with telemetry that clearly indicates the fault type
            const faultTelemetry = {
              stationId,
              timestamp: Date.now(),
              voltage: 230,
              current: 16,
              temperature: 25,
              powerOutput: 3.7,
              connectionStatus: 'connected' as const,
              chargingState: 'charging' as const
            };

            // Modify telemetry to clearly indicate the specific fault
            switch (faultType) {
              case 'overvoltage':
                faultTelemetry.voltage = 280;
                break;
              case 'undervoltage':
                faultTelemetry.voltage = 170;
                break;
              case 'overcurrent':
                faultTelemetry.current = 45;
                break;
              case 'overtemperature':
                faultTelemetry.temperature = 75;
                break;
              case 'connection_lost':
                faultTelemetry.connectionStatus = 'error';
                break;
              case 'charging_stalled':
                faultTelemetry.current = 0;
                faultTelemetry.chargingState = 'fault';
                break;
            }

            const mockFault: FaultEvent = {
              id: `fault-${Date.now()}`,
              stationId,
              type: faultType as FaultType,
              severity: 'critical',
              detectedAt: Date.now(),
              telemetrySnapshot: faultTelemetry,
              description: `${faultType} fault detected`
            };

            // Create supporting history that reinforces the fault pattern
            const history: TelemetryData[] = Array.from({ length: 5 }, (_, index) => {
              const historyTelemetry = { ...faultTelemetry };
              historyTelemetry.timestamp = Date.now() - (5 - index) * 1000;
              
              // Add progression toward fault condition
              const progression = index / 4; // 0 to 1
              switch (faultType) {
                case 'overvoltage':
                  historyTelemetry.voltage = 230 + (50 * progression);
                  break;
                case 'undervoltage':
                  historyTelemetry.voltage = 230 - (60 * progression);
                  break;
                case 'overcurrent':
                  historyTelemetry.current = 16 + (29 * progression);
                  break;
                case 'overtemperature':
                  historyTelemetry.temperature = 25 + (50 * progression);
                  break;
              }
              
              return historyTelemetry;
            });

            const diagnosis = diagnosisEngine.diagnose(mockFault, history);

            // Should provide high confidence for clear fault patterns
            expect(diagnosis.confidence).toBeGreaterThan(0.5);
            
            // Root cause should be relevant to fault type
            const rootCause = diagnosis.rootCause.toLowerCase();
            switch (faultType) {
              case 'overvoltage':
                expect(rootCause).toMatch(/voltage|surge|regulator/);
                break;
              case 'undervoltage':
                expect(rootCause).toMatch(/voltage|sag|power|supply/);
                break;
              case 'overcurrent':
                expect(rootCause).toMatch(/current|short|circuit/);
                break;
              case 'overtemperature':
                expect(rootCause).toMatch(/temperature|cooling|thermal|heat/);
                break;
              case 'connection_lost':
                expect(rootCause).toMatch(/connection|cable|communication/);
                break;
              case 'charging_stalled':
                expect(rootCause).toMatch(/charging|stall|battery|system/);
                break;
            }

            // Should have appropriate recovery actions
            const actions = diagnosis.recommendedActions.join(' ').toLowerCase();
            expect(actions.length).toBeGreaterThan(0);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
  // Property 6: Diagnosis Decision Logic
  // Validates: Requirements 2.3
  describe('Property 6: Diagnosis Decision Logic', () => {
    it('should select the most probable cause when multiple potential causes exist based on telemetry evidence', () => {
      // Feature: self-healing-ai-agent, Property 6: Diagnosis Decision Logic
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.record({
            primaryFaultStrength: fc.float({ min: 0.7, max: 1.0 }), // Strong evidence for primary fault
            secondaryFaultStrength: fc.float({ min: 0.3, max: 0.6 }), // Weaker evidence for secondary fault
            faultType: fc.constantFrom('overvoltage', 'overcurrent', 'overtemperature')
          }),
          (stationId, scenario) => {
            // Create a scenario with multiple potential causes but one clearly stronger
            const baseTelemetry = {
              stationId,
              timestamp: Date.now(),
              voltage: 230,
              current: 16,
              temperature: 25,
              powerOutput: 3.7,
              connectionStatus: 'connected' as const,
              chargingState: 'charging' as const
            };

            // Create telemetry that shows multiple issues but one dominant
            const faultTelemetry = { ...baseTelemetry };
            
            switch (scenario.faultType) {
              case 'overvoltage':
                // Primary: Strong overvoltage
                faultTelemetry.voltage = 250 + (30 * scenario.primaryFaultStrength);
                // Secondary: Mild overcurrent
                faultTelemetry.current = 32 + (8 * scenario.secondaryFaultStrength);
                break;
              case 'overcurrent':
                // Primary: Strong overcurrent
                faultTelemetry.current = 32 + (18 * scenario.primaryFaultStrength);
                // Secondary: Mild overvoltage
                faultTelemetry.voltage = 250 + (15 * scenario.secondaryFaultStrength);
                break;
              case 'overtemperature':
                // Primary: Strong overtemperature
                faultTelemetry.temperature = 60 + (20 * scenario.primaryFaultStrength);
                // Secondary: Mild overcurrent
                faultTelemetry.current = 32 + (6 * scenario.secondaryFaultStrength);
                break;
            }

            const mockFault: FaultEvent = {
              id: `fault-${Date.now()}`,
              stationId,
              type: scenario.faultType as FaultType,
              severity: 'critical',
              detectedAt: Date.now(),
              telemetrySnapshot: faultTelemetry,
              description: `${scenario.faultType} fault detected`
            };

            // Create history that supports the primary fault pattern
            const history: TelemetryData[] = Array.from({ length: 6 }, (_, index) => {
              const historyTelemetry = { ...baseTelemetry };
              historyTelemetry.timestamp = Date.now() - (6 - index) * 1000;
              
              const progression = index / 5; // 0 to 1
              
              switch (scenario.faultType) {
                case 'overvoltage':
                  // Show clear voltage increase pattern
                  historyTelemetry.voltage = 230 + (faultTelemetry.voltage - 230) * progression;
                  // Show mild current increase
                  historyTelemetry.current = 16 + (faultTelemetry.current - 16) * progression * 0.5;
                  break;
                case 'overcurrent':
                  // Show clear current increase pattern
                  historyTelemetry.current = 16 + (faultTelemetry.current - 16) * progression;
                  // Show mild voltage increase
                  historyTelemetry.voltage = 230 + (faultTelemetry.voltage - 230) * progression * 0.5;
                  break;
                case 'overtemperature':
                  // Show clear temperature increase pattern
                  historyTelemetry.temperature = 25 + (faultTelemetry.temperature - 25) * progression;
                  // Show mild current increase
                  historyTelemetry.current = 16 + (faultTelemetry.current - 16) * progression * 0.5;
                  break;
              }
              
              return historyTelemetry;
            });

            const diagnosis = diagnosisEngine.diagnose(mockFault, history);

            // Should select the primary fault cause (Requirements 2.3)
            expect(diagnosis.confidence).toBeGreaterThan(0.6);
            
            // Root cause should reflect the primary fault type
            const rootCause = diagnosis.rootCause.toLowerCase();
            switch (scenario.faultType) {
              case 'overvoltage':
                expect(rootCause).toMatch(/voltage|surge|regulator/);
                // Should not primarily focus on current issues
                expect(rootCause).not.toMatch(/^.*current.*$/);
                break;
              case 'overcurrent':
                expect(rootCause).toMatch(/current|short|circuit/);
                // Should not primarily focus on voltage issues
                expect(rootCause).not.toMatch(/^.*voltage.*$/);
                break;
              case 'overtemperature':
                expect(rootCause).toMatch(/temperature|cooling|thermal|heat/);
                // Should not primarily focus on current issues
                expect(rootCause).not.toMatch(/^.*current.*$/);
                break;
            }

            // Reasoning should mention the evidence that led to this conclusion
            const reasoning = diagnosis.reasoning.join(' ').toLowerCase();
            expect(reasoning.length).toBeGreaterThan(0);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should provide higher confidence for diagnoses with stronger supporting evidence', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('overvoltage', 'undervoltage', 'overcurrent', 'overtemperature'),
          fc.float({ min: 0.1, max: 1.0 }), // Evidence strength
          (stationId, faultType, evidenceStrength) => {
            const baseTelemetry = {
              stationId,
              timestamp: Date.now(),
              voltage: 230,
              current: 16,
              temperature: 25,
              powerOutput: 3.7,
              connectionStatus: 'connected' as const,
              chargingState: 'charging' as const
            };

            // Create fault telemetry with varying evidence strength
            const faultTelemetry = { ...baseTelemetry };
            
            switch (faultType) {
              case 'overvoltage':
                faultTelemetry.voltage = 250 + (50 * evidenceStrength);
                break;
              case 'undervoltage':
                faultTelemetry.voltage = 200 - (50 * evidenceStrength);
                break;
              case 'overcurrent':
                faultTelemetry.current = 32 + (20 * evidenceStrength);
                break;
              case 'overtemperature':
                faultTelemetry.temperature = 60 + (20 * evidenceStrength);
                break;
            }

            const mockFault: FaultEvent = {
              id: `fault-${Date.now()}`,
              stationId,
              type: faultType as FaultType,
              severity: evidenceStrength > 0.7 ? 'critical' : 'warning',
              detectedAt: Date.now(),
              telemetrySnapshot: faultTelemetry,
              description: `${faultType} fault detected`
            };

            // Create history with consistent evidence pattern
            const historyLength = Math.floor(3 + evidenceStrength * 7); // 3-10 data points
            const history: TelemetryData[] = Array.from({ length: historyLength }, (_, index) => {
              const historyTelemetry = { ...baseTelemetry };
              historyTelemetry.timestamp = Date.now() - (historyLength - index) * 1000;
              
              const progression = (index / (historyLength - 1)) * evidenceStrength;
              
              switch (faultType) {
                case 'overvoltage':
                  historyTelemetry.voltage = 230 + (faultTelemetry.voltage - 230) * progression;
                  break;
                case 'undervoltage':
                  historyTelemetry.voltage = 230 + (faultTelemetry.voltage - 230) * progression;
                  break;
                case 'overcurrent':
                  historyTelemetry.current = 16 + (faultTelemetry.current - 16) * progression;
                  break;
                case 'overtemperature':
                  historyTelemetry.temperature = 25 + (faultTelemetry.temperature - 25) * progression;
                  break;
              }
              
              return historyTelemetry;
            });

            const diagnosis = diagnosisEngine.diagnose(mockFault, history);

            // Confidence should correlate with evidence strength
            if (evidenceStrength > 0.8) {
              expect(diagnosis.confidence).toBeGreaterThan(0.7);
            } else if (evidenceStrength > 0.5) {
              expect(diagnosis.confidence).toBeGreaterThan(0.5);
            } else {
              // Even weak evidence should provide some confidence
              expect(diagnosis.confidence).toBeGreaterThan(0.3);
            }

            // Should still provide complete diagnosis regardless of confidence
            expect(diagnosis.rootCause.length).toBeGreaterThan(0);
            expect(diagnosis.reasoning.length).toBeGreaterThan(0);
            expect(diagnosis.recommendedActions.length).toBeGreaterThan(0);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should consider telemetry history patterns when making diagnosis decisions', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('overvoltage', 'overcurrent', 'overtemperature'),
          fc.constantFrom('rapid', 'gradual', 'stable'), // Pattern type
          (stationId, faultType, patternType) => {
            const baseTelemetry = {
              stationId,
              timestamp: Date.now(),
              voltage: 230,
              current: 16,
              temperature: 25,
              powerOutput: 3.7,
              connectionStatus: 'connected' as const,
              chargingState: 'charging' as const
            };

            // Create different patterns in telemetry history
            const historyLength = 8;
            const history: TelemetryData[] = Array.from({ length: historyLength }, (_, index) => {
              const historyTelemetry = { ...baseTelemetry };
              historyTelemetry.timestamp = Date.now() - (historyLength - index) * 1000;
              
              let progression: number;
              switch (patternType) {
                case 'rapid':
                  // Exponential increase in last few readings
                  progression = index < 5 ? 0 : Math.pow((index - 4) / 3, 2);
                  break;
                case 'gradual':
                  // Linear increase throughout history
                  progression = index / (historyLength - 1);
                  break;
                case 'stable':
                  // Stable until sudden change at end
                  progression = index === historyLength - 1 ? 1 : 0;
                  break;
                default:
                  progression = 0;
              }
              
              switch (faultType) {
                case 'overvoltage':
                  historyTelemetry.voltage = 230 + (50 * progression);
                  break;
                case 'overcurrent':
                  historyTelemetry.current = 16 + (20 * progression);
                  break;
                case 'overtemperature':
                  historyTelemetry.temperature = 25 + (40 * progression);
                  break;
              }
              
              return historyTelemetry;
            });

            // Create fault based on final telemetry state
            const finalTelemetry = history[history.length - 1];
            const mockFault: FaultEvent = {
              id: `fault-${Date.now()}`,
              stationId,
              type: faultType as FaultType,
              severity: 'critical',
              detectedAt: Date.now(),
              telemetrySnapshot: finalTelemetry,
              description: `${faultType} fault detected`
            };

            const diagnosis = diagnosisEngine.diagnose(mockFault, history);

            // Diagnosis should consider the pattern type in reasoning
            const reasoning = diagnosis.reasoning.join(' ').toLowerCase();
            
            switch (patternType) {
              case 'rapid':
                // Should mention rapid change or sudden increase
                expect(reasoning).toMatch(/rapid|sudden|quick|abrupt/);
                break;
              case 'gradual':
                // Should mention gradual change or trend
                expect(reasoning).toMatch(/gradual|trend|increase|pattern/);
                break;
              case 'stable':
                // Should mention stability or sudden change
                expect(reasoning).toMatch(/stable|sudden|abrupt/);
                break;
            }

            // Should provide appropriate confidence based on pattern clarity
            expect(diagnosis.confidence).toBeGreaterThan(0.4);
            
            // Should provide complete diagnosis
            expect(diagnosis.rootCause.length).toBeGreaterThan(0);
            expect(diagnosis.recommendedActions.length).toBeGreaterThan(0);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
  // Property 7: Diagnosis Fallback Behavior
  // Validates: Requirements 2.5
  describe('Property 7: Diagnosis Fallback Behavior', () => {
    it('should default to safe recovery procedures when diagnosis cannot determine specific cause', () => {
      // Feature: self-healing-ai-agent, Property 7: Diagnosis Fallback Behavior
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('overvoltage', 'undervoltage', 'overcurrent', 'overtemperature', 'connection_lost', 'charging_stalled'),
          fc.array(
            fc.record({
              voltage: fc.float({ min: 200, max: 250 }), // Normal range values
              current: fc.float({ min: 0, max: 32 }),
              temperature: fc.float({ min: 20, max: 60 }),
              connectionStatus: fc.constantFrom('connected', 'disconnected'),
              chargingState: fc.constantFrom('idle', 'charging', 'complete')
            }),
            { minLength: 0, maxLength: 3 } // Limited or no history
          ),
          (stationId, faultType, limitedHistory) => {
            // Create ambiguous fault scenario with minimal supporting evidence
            const ambiguousTelemetry = {
              stationId,
              timestamp: Date.now(),
              voltage: 230, // Normal values that don't clearly indicate cause
              current: 16,
              temperature: 25,
              powerOutput: 3.7,
              connectionStatus: 'connected' as const,
              chargingState: 'charging' as const
            };

            // Only slightly modify one parameter to create minimal fault indication
            switch (faultType) {
              case 'overvoltage':
                ambiguousTelemetry.voltage = 251; // Just barely over threshold
                break;
              case 'undervoltage':
                ambiguousTelemetry.voltage = 199; // Just barely under threshold
                break;
              case 'overcurrent':
                ambiguousTelemetry.current = 33; // Just barely over threshold
                break;
              case 'overtemperature':
                ambiguousTelemetry.temperature = 61; // Just barely over threshold
                break;
              case 'connection_lost':
                ambiguousTelemetry.connectionStatus = 'error';
                break;
              case 'charging_stalled':
                ambiguousTelemetry.current = 0;
                ambiguousTelemetry.chargingState = 'fault';
                break;
            }

            const mockFault: FaultEvent = {
              id: `fault-${Date.now()}`,
              stationId,
              type: faultType as FaultType,
              severity: 'warning', // Lower severity for ambiguous cases
              detectedAt: Date.now(),
              telemetrySnapshot: ambiguousTelemetry,
              description: `${faultType} fault detected`
            };

            // Create minimal, non-conclusive history
            const history: TelemetryData[] = limitedHistory.map((data, index) => ({
              stationId,
              timestamp: Date.now() - (limitedHistory.length - index) * 1000,
              voltage: data.voltage,
              current: data.current,
              temperature: data.temperature,
              powerOutput: (data.voltage * data.current) / 1000,
              connectionStatus: data.connectionStatus,
              chargingState: data.chargingState
            }));

            const diagnosis = diagnosisEngine.diagnose(mockFault, history);

            // Should provide fallback diagnosis (Requirements 2.5)
            expect(diagnosis).toBeDefined();
            expect(diagnosis.faultId).toBe(mockFault.id);

            // Fallback should have lower confidence but still provide guidance
            expect(diagnosis.confidence).toBeGreaterThan(0.1);
            expect(diagnosis.confidence).toBeLessThan(0.8); // Should be lower for ambiguous cases

            // Should provide safe, general recovery procedures
            expect(diagnosis.rootCause).toBeTypeOf('string');
            expect(diagnosis.rootCause.length).toBeGreaterThan(0);
            
            // Reasoning should acknowledge the uncertainty
            expect(Array.isArray(diagnosis.reasoning)).toBe(true);
            expect(diagnosis.reasoning.length).toBeGreaterThan(0);
            
            const reasoning = diagnosis.reasoning.join(' ').toLowerCase();
            // Should mention limited data or general approach
            expect(reasoning).toMatch(/general|limited|based on.*type|fallback|safe/);

            // Should provide safe, conservative recommended actions
            expect(Array.isArray(diagnosis.recommendedActions)).toBe(true);
            expect(diagnosis.recommendedActions.length).toBeGreaterThan(0);
            
            const actions = diagnosis.recommendedActions.join(' ').toLowerCase();
            // Actions should be safe and general
            expect(actions).toMatch(/check|reset|monitor|verify|inspect/);

            // Should provide reasonable recovery time estimate
            expect(diagnosis.estimatedRecoveryTime).toBeTypeOf('number');
            expect(diagnosis.estimatedRecoveryTime).toBeGreaterThan(0);
            expect(diagnosis.estimatedRecoveryTime).toBeLessThan(10000);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should provide consistent fallback behavior regardless of fault type when evidence is insufficient', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('overvoltage', 'undervoltage', 'overcurrent', 'overtemperature', 'connection_lost', 'charging_stalled'),
          (stationId, faultType) => {
            // Create fault with completely normal telemetry (should trigger fallback)
            const normalTelemetry = {
              stationId,
              timestamp: Date.now(),
              voltage: 230,
              current: 16,
              temperature: 25,
              powerOutput: 3.7,
              connectionStatus: 'connected' as const,
              chargingState: 'charging' as const
            };

            const mockFault: FaultEvent = {
              id: `fault-${Date.now()}`,
              stationId,
              type: faultType as FaultType,
              severity: 'warning',
              detectedAt: Date.now(),
              telemetrySnapshot: normalTelemetry,
              description: `${faultType} fault detected`
            };

            // No history provided (should definitely trigger fallback)
            const diagnosis = diagnosisEngine.diagnose(mockFault, []);

            // Should provide fallback diagnosis for all fault types
            expect(diagnosis).toBeDefined();
            expect(diagnosis.confidence).toBeLessThan(0.8); // Should be lower confidence

            // Should provide fault-type-appropriate fallback
            const rootCause = diagnosis.rootCause.toLowerCase();
            switch (faultType) {
              case 'overvoltage':
              case 'undervoltage':
                expect(rootCause).toMatch(/voltage|power|supply|regulation/);
                break;
              case 'overcurrent':
                expect(rootCause).toMatch(/current|control|circuit/);
                break;
              case 'overtemperature':
                expect(rootCause).toMatch(/temperature|thermal|cooling/);
                break;
              case 'connection_lost':
                expect(rootCause).toMatch(/connection|communication|cable/);
                break;
              case 'charging_stalled':
                expect(rootCause).toMatch(/charging|process|system/);
                break;
            }

            // Should provide safe, general actions
            const actions = diagnosis.recommendedActions.join(' ').toLowerCase();
            expect(actions.length).toBeGreaterThan(0);
            expect(actions).toMatch(/check|reset|monitor|verify/);

            // Should acknowledge limited information in reasoning
            const reasoning = diagnosis.reasoning.join(' ').toLowerCase();
            expect(reasoning).toMatch(/general|limited|based on.*type|no.*specific/);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should escalate to more comprehensive procedures when specific diagnosis rules fail to match', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('overvoltage', 'undervoltage', 'overcurrent', 'overtemperature'),
          fc.array(
            fc.record({
              voltage: fc.float({ min: 220, max: 240 }), // Values that won't trigger specific rules
              current: fc.float({ min: 10, max: 25 }),
              temperature: fc.float({ min: 30, max: 50 })
            }),
            { minLength: 3, maxLength: 8 }
          ),
          (stationId, faultType, confusingHistory) => {
            // Create telemetry that indicates a fault but doesn't match specific patterns
            const confusingTelemetry = {
              stationId,
              timestamp: Date.now(),
              voltage: 230,
              current: 16,
              temperature: 25,
              powerOutput: 3.7,
              connectionStatus: 'connected' as const,
              chargingState: 'charging' as const
            };

            // Modify to show fault but with confusing pattern
            switch (faultType) {
              case 'overvoltage':
                confusingTelemetry.voltage = 255; // Fault level but not matching specific patterns
                break;
              case 'undervoltage':
                confusingTelemetry.voltage = 195;
                break;
              case 'overcurrent':
                confusingTelemetry.current = 35;
                break;
              case 'overtemperature':
                confusingTelemetry.temperature = 65;
                break;
            }

            const mockFault: FaultEvent = {
              id: `fault-${Date.now()}`,
              stationId,
              type: faultType as FaultType,
              severity: 'warning',
              detectedAt: Date.now(),
              telemetrySnapshot: confusingTelemetry,
              description: `${faultType} fault detected`
            };

            // Create history with inconsistent or confusing patterns
            const history: TelemetryData[] = confusingHistory.map((data, index) => ({
              stationId,
              timestamp: Date.now() - (confusingHistory.length - index) * 1000,
              voltage: data.voltage + (Math.random() - 0.5) * 10, // Add noise
              current: data.current + (Math.random() - 0.5) * 5,
              temperature: data.temperature + (Math.random() - 0.5) * 8,
              powerOutput: 3.7,
              connectionStatus: 'connected',
              chargingState: 'charging'
            }));

            const diagnosis = diagnosisEngine.diagnose(mockFault, history);

            // Should provide fallback with comprehensive procedures
            expect(diagnosis).toBeDefined();
            expect(diagnosis.confidence).toBeGreaterThan(0.3); // Some confidence from fault type
            expect(diagnosis.confidence).toBeLessThan(0.8); // But not high due to unclear pattern

            // Should provide comprehensive recovery actions
            expect(diagnosis.recommendedActions.length).toBeGreaterThanOrEqual(2);
            
            const actions = diagnosis.recommendedActions.join(' ').toLowerCase();
            // Should include multiple types of actions for comprehensive approach
            expect(actions).toMatch(/check|reset|monitor/);

            // Reasoning should acknowledge the uncertainty and comprehensive approach
            const reasoning = diagnosis.reasoning.join(' ').toLowerCase();
            expect(reasoning.length).toBeGreaterThan(50); // Should be detailed

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});