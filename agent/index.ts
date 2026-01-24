// Main entry point for the Self-Healing AI Agent system
// Exports all core interfaces and implementations

// Core types
export * from './types.js';

// Module interfaces and implementations
export * from './telemetrySimulator.js';
export * from './faultDetector.js';
export * from './agentState.js';

// Modules to be implemented in later tasks
export * from './diagnosisEngine.js';
export * from './recoveryActions.js';

// Demo and utilities
export * from './demo.js';

// Main agent controller (will be implemented in task 10)
export interface AgentController {
  initialize(stationId: string): Promise<void>;
  start(): void;
  stop(): void;
  getStatus(stationId: string): AgentState;
}

export class AgentControllerImpl implements AgentController {
  initialize(stationId: string): Promise<void> {
    throw new Error('Not implemented yet - will be implemented in task 10');
  }

  start(): void {
    throw new Error('Not implemented yet - will be implemented in task 10');
  }

  stop(): void {
    throw new Error('Not implemented yet - will be implemented in task 10');
  }

  getStatus(stationId: string): AgentState {
    throw new Error('Not implemented yet - will be implemented in task 10');
  }
}