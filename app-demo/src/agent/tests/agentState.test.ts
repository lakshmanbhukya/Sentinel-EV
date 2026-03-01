// Property-based tests for Agent State Manager
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { AgentStateManagerImpl } from '../agentState.js';
import { AgentState, FaultEvent, DiagnosisResult, RecoveryPlan } from '../types.js';

describe('Agent State Manager Property Tests', () => {
  let stateManager: AgentStateManagerImpl;

  beforeEach(() => {
    stateManager = new AgentStateManagerImpl();
  });

  // Property 3: State Machine Transitions
  // Validates: Requirements 1.3, 2.2, 3.2, 6.1, 6.2, 6.5
  describe('Property 3: State Machine Transitions', () => {
    it('should follow valid finite state machine transitions for any sequence of valid operations', () => {
      // Feature: self-healing-ai-agent, Property 3: State Machine Transitions
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // Station ID
          fc.array(
            fc.oneof(
              fc.constant({ action: 'fault_detected' }),
              fc.constant({ action: 'diagnosis_started' }),
              fc.constant({ action: 'diagnosis_complete' }),
              fc.constant({ action: 'recovery_complete' }),
              fc.constant({ action: 'recovery_failed' }),
              fc.constant({ action: 'fault_resolved' }),
              fc.constant({ action: 'cycle_complete' }),
              fc.constant({ action: 'new_fault_detected' })
            ),
            { minLength: 1, maxLength: 10 }
          ),
          (stationId, actions) => {
            // Start with initial state
            let currentState = stateManager.getState(stationId);
            expect(currentState.phase).toBe('STABLE');

            // Apply each action and verify valid transitions
            for (const action of actions) {
              const previousPhase = currentState.phase;
              let transitionAttempted = false;
              let transitionSuccessful = false;

              switch (action.action) {
                case 'fault_detected':
                  if (previousPhase === 'STABLE' || previousPhase === 'RESOLVED') {
                    transitionSuccessful = stateManager.transitionTo(stationId, 'CRITICAL', { trigger: action.action });
                    transitionAttempted = true;
                  }
                  break;

                case 'diagnosis_started':
                  if (previousPhase === 'CRITICAL') {
                    transitionSuccessful = stateManager.transitionTo(stationId, 'DIAGNOSING', { trigger: action.action });
                    transitionAttempted = true;
                  }
                  break;

                case 'diagnosis_complete':
                  if (previousPhase === 'DIAGNOSING') {
                    transitionSuccessful = stateManager.transitionTo(stationId, 'EXECUTING', { trigger: action.action });
                    transitionAttempted = true;
                  }
                  break;

                case 'recovery_complete':
                  if (previousPhase === 'EXECUTING') {
                    transitionSuccessful = stateManager.transitionTo(stationId, 'RESOLVED', { trigger: action.action });
                    transitionAttempted = true;
                  }
                  break;

                case 'recovery_failed':
                  if (previousPhase === 'EXECUTING') {
                    transitionSuccessful = stateManager.transitionTo(stationId, 'CRITICAL', { trigger: action.action });
                    transitionAttempted = true;
                  }
                  break;

                case 'fault_resolved':
                  if (['CRITICAL', 'DIAGNOSING', 'EXECUTING'].includes(previousPhase)) {
                    transitionSuccessful = stateManager.transitionTo(stationId, 'STABLE', { trigger: action.action });
                    transitionAttempted = true;
                  }
                  break;

                case 'cycle_complete':
                  if (previousPhase === 'RESOLVED') {
                    transitionSuccessful = stateManager.transitionTo(stationId, 'STABLE', { trigger: action.action });
                    transitionAttempted = true;
                  }
                  break;

                case 'new_fault_detected':
                  if (previousPhase === 'RESOLVED') {
                    transitionSuccessful = stateManager.transitionTo(stationId, 'CRITICAL', { trigger: action.action });
                    transitionAttempted = true;
                  }
                  break;
              }

              // If transition was attempted, it should succeed for valid transitions
              if (transitionAttempted) {
                expect(transitionSuccessful).toBe(true);
              }

              // Update current state
              currentState = stateManager.getState(stationId);
            }

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject invalid state transitions and maintain current state', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('STABLE', 'CRITICAL', 'DIAGNOSING', 'EXECUTING', 'RESOLVED'),
          fc.constantFrom('STABLE', 'CRITICAL', 'DIAGNOSING', 'EXECUTING', 'RESOLVED'),
          (stationId, fromState, toState) => {
            // Set up initial state
            const initialState = stateManager.getState(stationId);
            
            // Force the state to the desired starting state for testing
            if (fromState !== 'STABLE') {
              // We need to transition through valid paths to reach the desired state
              switch (fromState) {
                case 'CRITICAL':
                  stateManager.transitionTo(stationId, 'CRITICAL', { trigger: 'fault_detected' });
                  break;
                case 'DIAGNOSING':
                  stateManager.transitionTo(stationId, 'CRITICAL', { trigger: 'fault_detected' });
                  stateManager.transitionTo(stationId, 'DIAGNOSING', { trigger: 'diagnosis_started' });
                  break;
                case 'EXECUTING':
                  stateManager.transitionTo(stationId, 'CRITICAL', { trigger: 'fault_detected' });
                  stateManager.transitionTo(stationId, 'DIAGNOSING', { trigger: 'diagnosis_started' });
                  stateManager.transitionTo(stationId, 'EXECUTING', { trigger: 'diagnosis_complete' });
                  break;
                case 'RESOLVED':
                  stateManager.transitionTo(stationId, 'CRITICAL', { trigger: 'fault_detected' });
                  stateManager.transitionTo(stationId, 'DIAGNOSING', { trigger: 'diagnosis_started' });
                  stateManager.transitionTo(stationId, 'EXECUTING', { trigger: 'diagnosis_complete' });
                  stateManager.transitionTo(stationId, 'RESOLVED', { trigger: 'recovery_complete' });
                  break;
              }
            }

            const currentState = stateManager.getState(stationId);
            expect(currentState.phase).toBe(fromState);

            // Define valid transitions
            const validTransitions = new Map([
              ['STABLE', ['CRITICAL']],
              ['CRITICAL', ['DIAGNOSING', 'STABLE']],
              ['DIAGNOSING', ['EXECUTING', 'STABLE']],
              ['EXECUTING', ['RESOLVED', 'CRITICAL', 'STABLE']],
              ['RESOLVED', ['STABLE', 'CRITICAL']]
            ]);

            const isValidTransition = validTransitions.get(fromState)?.includes(toState) || fromState === toState;

            // Attempt the transition
            const transitionResult = stateManager.transitionTo(stationId, toState as AgentState['phase'], { trigger: 'test' });

            if (isValidTransition) {
              expect(transitionResult).toBe(true);
              expect(stateManager.getCurrentPhase(stationId)).toBe(toState);
            } else {
              expect(transitionResult).toBe(false);
              expect(stateManager.getCurrentPhase(stationId)).toBe(fromState); // Should remain in original state
            }

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain state consistency across multiple concurrent stations', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 5 }),
          fc.array(
            fc.record({
              stationIndex: fc.integer({ min: 0, max: 4 }),
              action: fc.constantFrom('fault_detected', 'diagnosis_started', 'diagnosis_complete', 'recovery_complete', 'cycle_complete')
            }),
            { minLength: 5, maxLength: 15 }
          ),
          (stationIds, operations) => {
            // Initialize all stations
            const stationStates = new Map<string, AgentState['phase']>();
            stationIds.forEach(stationId => {
              const state = stateManager.getState(stationId);
              stationStates.set(stationId, state.phase);
            });

            // Apply operations
            for (const op of operations) {
              const stationId = stationIds[op.stationIndex % stationIds.length];
              const currentPhase = stateManager.getCurrentPhase(stationId);

              // Apply valid transitions based on current state
              switch (op.action) {
                case 'fault_detected':
                  if (currentPhase === 'STABLE') {
                    stateManager.transitionTo(stationId, 'CRITICAL', { trigger: op.action });
                    stationStates.set(stationId, 'CRITICAL');
                  }
                  break;
                case 'diagnosis_started':
                  if (currentPhase === 'CRITICAL') {
                    stateManager.transitionTo(stationId, 'DIAGNOSING', { trigger: op.action });
                    stationStates.set(stationId, 'DIAGNOSING');
                  }
                  break;
                case 'diagnosis_complete':
                  if (currentPhase === 'DIAGNOSING') {
                    stateManager.transitionTo(stationId, 'EXECUTING', { trigger: op.action });
                    stationStates.set(stationId, 'EXECUTING');
                  }
                  break;
                case 'recovery_complete':
                  if (currentPhase === 'EXECUTING') {
                    stateManager.transitionTo(stationId, 'RESOLVED', { trigger: op.action });
                    stationStates.set(stationId, 'RESOLVED');
                  }
                  break;
                case 'cycle_complete':
                  if (currentPhase === 'RESOLVED') {
                    stateManager.transitionTo(stationId, 'STABLE', { trigger: op.action });
                    stationStates.set(stationId, 'STABLE');
                  }
                  break;
              }
            }

            // Verify each station maintains its expected state
            stationIds.forEach(stationId => {
              const expectedPhase = stationStates.get(stationId);
              const actualPhase = stateManager.getCurrentPhase(stationId);
              expect(actualPhase).toBe(expectedPhase);
            });

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
  // Property 4: Event Logging Completeness
  // Validates: Requirements 1.5
  describe('Property 4: Event Logging Completeness', () => {
    it('should create complete log entries for any fault detection event with timestamp and details', () => {
      // Feature: self-healing-ai-agent, Property 4: Event Logging Completeness
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // Station ID
          fc.record({
            faultId: fc.string({ minLength: 1, maxLength: 100 }),
            faultType: fc.constantFrom('overvoltage', 'undervoltage', 'overcurrent', 'overtemperature', 'connection_lost', 'charging_stalled'),
            severity: fc.constantFrom('warning', 'critical'),
            description: fc.string({ minLength: 10, maxLength: 200 })
          }),
          (stationId, faultData) => {
            const mockFault: FaultEvent = {
              id: faultData.faultId,
              stationId,
              type: faultData.faultType as any,
              severity: faultData.severity as any,
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
              description: faultData.description
            };

            const beforeLogCount = stateManager.getLogs(stationId).length;
            
            // Set fault (this should trigger logging)
            stateManager.setFault(stationId, mockFault);
            
            const afterLogs = stateManager.getLogs(stationId);
            const newLogs = afterLogs.slice(beforeLogCount);

            // Should have created at least one log entry
            expect(newLogs.length).toBeGreaterThan(0);

            // Find the fault detection log
            const faultLog = newLogs.find(log => 
              log.message.includes('Fault detected') && 
              log.message.includes(faultData.faultType)
            );

            expect(faultLog).toBeDefined();

            if (faultLog) {
              // Verify log completeness (Requirements 1.5)
              expect(faultLog.timestamp).toBeTypeOf('number');
              expect(faultLog.timestamp).toBeGreaterThan(0);
              expect(faultLog.level).toBe('warning'); // Fault detection logs are warnings
              expect(faultLog.message).toContain(faultData.faultType);
              
              // Verify fault details are included
              expect(faultLog.data).toBeDefined();
              expect(faultLog.data.faultId).toBe(faultData.faultId);
              expect(faultLog.data.severity).toBe(faultData.severity);
            }

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain chronological order and completeness for any sequence of logged events', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.array(
            fc.record({
              level: fc.constantFrom('info', 'warning', 'error'),
              message: fc.string({ minLength: 5, maxLength: 100 }),
              hasData: fc.boolean()
            }),
            { minLength: 3, maxLength: 15 }
          ),
          (stationId, logEvents) => {
            const startTime = Date.now();
            const loggedEvents: Array<{ timestamp: number; level: string; message: string }> = [];

            // Add logs with small delays to ensure timestamp ordering
            for (let i = 0; i < logEvents.length; i++) {
              const event = logEvents[i];
              const data = event.hasData ? { eventIndex: i, testData: 'test' } : undefined;
              
              stateManager.addLog(stationId, event.level as any, event.message, data);
              
              loggedEvents.push({
                timestamp: Date.now(),
                level: event.level,
                message: event.message
              });

              // Small delay to ensure timestamp differences
              if (i < logEvents.length - 1) {
                // Simulate small processing time
                const delay = Math.random() * 2;
                const endTime = Date.now() + delay;
                while (Date.now() < endTime) { /* busy wait */ }
              }
            }

            const retrievedLogs = stateManager.getLogs(stationId);
            const newLogs = retrievedLogs.filter(log => log.timestamp >= startTime);

            // Should have all the logs we added
            expect(newLogs.length).toBeGreaterThanOrEqual(logEvents.length);

            // Verify chronological order
            for (let i = 1; i < newLogs.length; i++) {
              expect(newLogs[i].timestamp).toBeGreaterThanOrEqual(newLogs[i - 1].timestamp);
            }

            // Verify all expected messages are present
            const logMessages = newLogs.map(log => log.message);
            logEvents.forEach(event => {
              expect(logMessages).toContain(event.message);
            });

            // Verify log structure completeness
            newLogs.forEach(log => {
              expect(log.timestamp).toBeTypeOf('number');
              expect(log.level).toMatch(/^(info|warning|error)$/);
              expect(log.message).toBeTypeOf('string');
              expect(log.message.length).toBeGreaterThan(0);
            });

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle log filtering by level and maintain data integrity', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.array(
            fc.record({
              level: fc.constantFrom('info', 'warning', 'error'),
              message: fc.string({ minLength: 5, maxLength: 50 })
            }),
            { minLength: 5, maxLength: 20 }
          ),
          fc.constantFrom('info', 'warning', 'error'),
          (stationId, logEvents, filterLevel) => {
            // Add all log events
            logEvents.forEach(event => {
              stateManager.addLog(stationId, event.level as any, event.message);
            });

            // Get filtered logs
            const filteredLogs = stateManager.getLogs(stationId, filterLevel as any);
            const allLogs = stateManager.getLogs(stationId);

            // All filtered logs should have the correct level
            filteredLogs.forEach(log => {
              expect(log.level).toBe(filterLevel);
            });

            // Count should match expected
            const expectedCount = logEvents.filter(event => event.level === filterLevel).length;
            const actualFilteredCount = filteredLogs.filter(log => 
              logEvents.some(event => event.message === log.message && event.level === filterLevel)
            ).length;

            expect(actualFilteredCount).toBe(expectedCount);

            // Filtered logs should be subset of all logs
            filteredLogs.forEach(filteredLog => {
              const foundInAll = allLogs.some(log => 
                log.timestamp === filteredLog.timestamp && 
                log.message === filteredLog.message &&
                log.level === filteredLog.level
              );
              expect(foundInAll).toBe(true);
            });

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
  // Property 18: State Change Event Emission
  // Validates: Requirements 6.4
  describe('Property 18: State Change Event Emission', () => {
    it('should emit state change events for any valid state transition with correct parameters', () => {
      // Feature: self-healing-ai-agent, Property 18: State Change Event Emission
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // Station ID
          fc.array(
            fc.record({
              fromState: fc.constantFrom('STABLE', 'CRITICAL', 'DIAGNOSING', 'EXECUTING', 'RESOLVED'),
              toState: fc.constantFrom('STABLE', 'CRITICAL', 'DIAGNOSING', 'EXECUTING', 'RESOLVED'),
              trigger: fc.string({ minLength: 1, maxLength: 50 })
            }),
            { minLength: 1, maxLength: 8 }
          ),
          (stationId, transitions) => {
            const emittedEvents: Array<{
              stationId: string;
              oldState: AgentState['phase'];
              newState: AgentState['phase'];
            }> = [];

            // Register callback to capture events
            stateManager.onStateChange((emittedStationId, oldState, newState) => {
              emittedEvents.push({
                stationId: emittedStationId,
                oldState,
                newState
              });
            });

            // Start with known state
            const initialState = stateManager.getState(stationId);
            let currentPhase = initialState.phase;

            let validTransitionCount = 0;

            // Apply transitions
            for (const transition of transitions) {
              // Set up the current state to match the desired fromState
              if (currentPhase !== transition.fromState) {
                // Navigate to the desired fromState through valid transitions
                const success = this.navigateToState(stateManager, stationId, currentPhase, transition.fromState);
                if (success) {
                  currentPhase = transition.fromState;
                }
              }

              // Attempt the transition
              if (currentPhase === transition.fromState) {
                const transitionSuccess = stateManager.transitionTo(
                  stationId, 
                  transition.toState as AgentState['phase'], 
                  { trigger: transition.trigger }
                );

                if (transitionSuccess) {
                  validTransitionCount++;
                  currentPhase = transition.toState as AgentState['phase'];
                }
              }
            }

            // Verify events were emitted for valid transitions
            const relevantEvents = emittedEvents.filter(event => event.stationId === stationId);
            
            // Should have at least as many events as valid transitions
            // (might have more due to navigation to setup states)
            expect(relevantEvents.length).toBeGreaterThanOrEqual(validTransitionCount);

            // Verify event structure and correctness
            relevantEvents.forEach(event => {
              expect(event.stationId).toBe(stationId);
              expect(event.oldState).toMatch(/^(STABLE|CRITICAL|DIAGNOSING|EXECUTING|RESOLVED)$/);
              expect(event.newState).toMatch(/^(STABLE|CRITICAL|DIAGNOSING|EXECUTING|RESOLVED)$/);
              expect(event.oldState).not.toBe(event.newState); // Should only emit for actual changes
            });

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should emit events to multiple registered callbacks without interference', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 2, max: 5 }), // Number of callbacks
          fc.array(
            fc.constantFrom('fault_detected', 'diagnosis_started', 'diagnosis_complete', 'recovery_complete', 'cycle_complete'),
            { minLength: 3, maxLength: 8 }
          ),
          (stationId, numCallbacks, actions) => {
            const callbackResults: Array<Array<{
              stationId: string;
              oldState: AgentState['phase'];
              newState: AgentState['phase'];
            }>> = [];

            // Register multiple callbacks
            for (let i = 0; i < numCallbacks; i++) {
              const callbackEvents: Array<{
                stationId: string;
                oldState: AgentState['phase'];
                newState: AgentState['phase'];
              }> = [];
              
              stateManager.onStateChange((emittedStationId, oldState, newState) => {
                callbackEvents.push({
                  stationId: emittedStationId,
                  oldState,
                  newState
                });
              });
              
              callbackResults.push(callbackEvents);
            }

            // Perform state transitions
            let currentPhase = stateManager.getCurrentPhase(stationId);
            let validTransitions = 0;

            for (const action of actions) {
              let transitionMade = false;

              switch (action) {
                case 'fault_detected':
                  if (currentPhase === 'STABLE') {
                    stateManager.transitionTo(stationId, 'CRITICAL', { trigger: action });
                    currentPhase = 'CRITICAL';
                    transitionMade = true;
                  }
                  break;
                case 'diagnosis_started':
                  if (currentPhase === 'CRITICAL') {
                    stateManager.transitionTo(stationId, 'DIAGNOSING', { trigger: action });
                    currentPhase = 'DIAGNOSING';
                    transitionMade = true;
                  }
                  break;
                case 'diagnosis_complete':
                  if (currentPhase === 'DIAGNOSING') {
                    stateManager.transitionTo(stationId, 'EXECUTING', { trigger: action });
                    currentPhase = 'EXECUTING';
                    transitionMade = true;
                  }
                  break;
                case 'recovery_complete':
                  if (currentPhase === 'EXECUTING') {
                    stateManager.transitionTo(stationId, 'RESOLVED', { trigger: action });
                    currentPhase = 'RESOLVED';
                    transitionMade = true;
                  }
                  break;
                case 'cycle_complete':
                  if (currentPhase === 'RESOLVED') {
                    stateManager.transitionTo(stationId, 'STABLE', { trigger: action });
                    currentPhase = 'STABLE';
                    transitionMade = true;
                  }
                  break;
              }

              if (transitionMade) {
                validTransitions++;
              }
            }

            // Verify all callbacks received the same events
            if (validTransitions > 0) {
              const firstCallbackEvents = callbackResults[0].filter(e => e.stationId === stationId);
              
              for (let i = 1; i < callbackResults.length; i++) {
                const otherCallbackEvents = callbackResults[i].filter(e => e.stationId === stationId);
                
                // Should have same number of events
                expect(otherCallbackEvents.length).toBe(firstCallbackEvents.length);
                
                // Events should be identical
                for (let j = 0; j < firstCallbackEvents.length; j++) {
                  expect(otherCallbackEvents[j].stationId).toBe(firstCallbackEvents[j].stationId);
                  expect(otherCallbackEvents[j].oldState).toBe(firstCallbackEvents[j].oldState);
                  expect(otherCallbackEvents[j].newState).toBe(firstCallbackEvents[j].newState);
                }
              }
            }

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should not emit events for invalid transition attempts', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.array(
            fc.record({
              fromState: fc.constantFrom('STABLE', 'CRITICAL', 'DIAGNOSING', 'EXECUTING', 'RESOLVED'),
              invalidToState: fc.constantFrom('STABLE', 'CRITICAL', 'DIAGNOSING', 'EXECUTING', 'RESOLVED')
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (stationId, invalidTransitions) => {
            const emittedEvents: Array<{
              stationId: string;
              oldState: AgentState['phase'];
              newState: AgentState['phase'];
            }> = [];

            stateManager.onStateChange((emittedStationId, oldState, newState) => {
              emittedEvents.push({
                stationId: emittedStationId,
                oldState,
                newState
              });
            });

            // Define invalid transitions (transitions that should not be allowed)
            const invalidTransitionMap = new Map([
              ['STABLE', ['DIAGNOSING', 'EXECUTING', 'RESOLVED']],
              ['CRITICAL', ['EXECUTING', 'RESOLVED']],
              ['DIAGNOSING', ['CRITICAL', 'RESOLVED']],
              ['EXECUTING', []],
              ['RESOLVED', ['DIAGNOSING', 'EXECUTING']]
            ]);

            let attemptedInvalidTransitions = 0;

            for (const transition of invalidTransitions) {
              // Navigate to the fromState
              const success = this.navigateToState(stateManager, stationId, stateManager.getCurrentPhase(stationId), transition.fromState);
              
              if (success) {
                const invalidTargets = invalidTransitionMap.get(transition.fromState) || [];
                
                if (invalidTargets.includes(transition.invalidToState)) {
                  const eventCountBefore = emittedEvents.filter(e => e.stationId === stationId).length;
                  
                  // Attempt invalid transition
                  const transitionResult = stateManager.transitionTo(
                    stationId, 
                    transition.invalidToState as AgentState['phase'], 
                    { trigger: 'invalid_test' }
                  );
                  
                  const eventCountAfter = emittedEvents.filter(e => e.stationId === stationId).length;
                  
                  // Should not succeed
                  expect(transitionResult).toBe(false);
                  
                  // Should not emit event for failed transition
                  expect(eventCountAfter).toBe(eventCountBefore);
                  
                  // State should remain unchanged
                  expect(stateManager.getCurrentPhase(stationId)).toBe(transition.fromState);
                  
                  attemptedInvalidTransitions++;
                }
              }
            }

            return attemptedInvalidTransitions > 0; // Only validate if we actually tested invalid transitions
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // Helper method for navigating to a target state
  navigateToState(manager: AgentStateManagerImpl, stationId: string, currentState: AgentState['phase'], targetState: AgentState['phase']): boolean {
    if (currentState === targetState) {
      return true;
    }

    // Define paths to reach each state from STABLE
    const pathsFromStable = new Map([
      ['CRITICAL', ['fault_detected']],
      ['DIAGNOSING', ['fault_detected', 'diagnosis_started']],
      ['EXECUTING', ['fault_detected', 'diagnosis_started', 'diagnosis_complete']],
      ['RESOLVED', ['fault_detected', 'diagnosis_started', 'diagnosis_complete', 'recovery_complete']]
    ]);

    // Reset to STABLE first if needed
    if (currentState !== 'STABLE') {
      manager.reset(stationId);
    }

    // Navigate to target state
    const path = pathsFromStable.get(targetState);
    if (!path) {
      return targetState === 'STABLE';
    }

    const stateSequence: AgentState['phase'][] = ['STABLE', 'CRITICAL', 'DIAGNOSING', 'EXECUTING', 'RESOLVED'];
    const targetIndex = stateSequence.indexOf(targetState);

    for (let i = 0; i < targetIndex; i++) {
      const success = manager.transitionTo(stationId, stateSequence[i + 1], { trigger: path[i] });
      if (!success) {
        return false;
      }
    }

    return manager.getCurrentPhase(stationId) === targetState;
  }
});