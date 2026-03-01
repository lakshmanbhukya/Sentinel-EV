// Agent State Manager for Self-Healing AI Agent
// Implements finite state machine with states: STABLE→CRITICAL→DIAGNOSING→EXECUTING→RESOLVED

import { AgentState, StateTransition, AgentLog, FaultEvent, DiagnosisResult, RecoveryPlan } from './types.js';

export interface AgentStateManager {
  getState(stationId: string): AgentState;
  transitionTo(stationId: string, newPhase: AgentState['phase'], context?: any): boolean;
  addLog(stationId: string, level: AgentLog['level'], message: string, data?: any): void;
  setFault(stationId: string, fault: FaultEvent): void;
  setDiagnosis(stationId: string, diagnosis: DiagnosisResult): void;
  setRecoveryPlan(stationId: string, plan: RecoveryPlan): void;
  reset(stationId: string): void;
  onStateChange(callback: (stationId: string, oldState: AgentState['phase'], newState: AgentState['phase']) => void): void;
}

type StateChangeCallback = (stationId: string, oldState: AgentState['phase'], newState: AgentState['phase']) => void;

export class AgentStateManagerImpl implements AgentStateManager {
  private states = new Map<string, AgentState>();
  private stateChangeCallbacks: StateChangeCallback[] = [];

  // Valid state transitions based on finite state machine rules
  private readonly VALID_TRANSITIONS: StateTransition[] = [
    // From STABLE
    { from: 'STABLE', to: 'CRITICAL', trigger: 'fault_detected' },
    
    // From CRITICAL
    { from: 'CRITICAL', to: 'DIAGNOSING', trigger: 'diagnosis_started' },
    { from: 'CRITICAL', to: 'STABLE', trigger: 'fault_resolved' }, // Direct resolution without diagnosis
    
    // From DIAGNOSING
    { from: 'DIAGNOSING', to: 'EXECUTING', trigger: 'diagnosis_complete' },
    { from: 'DIAGNOSING', to: 'STABLE', trigger: 'fault_resolved' }, // Fault resolved during diagnosis
    
    // From EXECUTING
    { from: 'EXECUTING', to: 'RESOLVED', trigger: 'recovery_complete' },
    { from: 'EXECUTING', to: 'CRITICAL', trigger: 'recovery_failed' }, // Retry cycle
    { from: 'EXECUTING', to: 'STABLE', trigger: 'fault_resolved' }, // External resolution
    
    // From RESOLVED
    { from: 'RESOLVED', to: 'STABLE', trigger: 'cycle_complete' },
    { from: 'RESOLVED', to: 'CRITICAL', trigger: 'new_fault_detected' } // New fault during resolution
  ];

  getState(stationId: string): AgentState {
    let state = this.states.get(stationId);
    if (!state) {
      // Initialize new agent state
      state = this.createInitialState(stationId);
      this.states.set(stationId, state);
      this.addLog(stationId, 'info', 'Agent initialized', { phase: 'STABLE' });
    }
    return { ...state }; // Return copy to prevent external mutation
  }

  transitionTo(stationId: string, newPhase: AgentState['phase'], context?: any): boolean {
    const currentState = this.getState(stationId);
    const oldPhase = currentState.phase;

    // Validate transition
    if (!this.isValidTransition(oldPhase, newPhase)) {
      this.addLog(stationId, 'error', `Invalid state transition from ${oldPhase} to ${newPhase}`, context);
      return false;
    }

    // Update state
    const updatedState = this.states.get(stationId)!;
    updatedState.phase = newPhase;

    // Log state change
    this.addLog(stationId, 'info', `State transition: ${oldPhase} → ${newPhase}`, context);

    // Emit state change event
    this.emitStateChange(stationId, oldPhase, newPhase);

    return true;
  }

  addLog(stationId: string, level: AgentLog['level'], message: string, data?: any): void {
    const state = this.states.get(stationId);
    if (!state) {
      // Create state if it doesn't exist
      this.getState(stationId);
      return this.addLog(stationId, level, message, data);
    }

    const logEntry: AgentLog = {
      timestamp: Date.now(),
      level,
      message,
      data
    };

    state.logs.push(logEntry);

    // Keep only last 100 log entries to prevent memory issues
    if (state.logs.length > 100) {
      state.logs = state.logs.slice(-100);
    }
  }

  setFault(stationId: string, fault: FaultEvent): void {
    const state = this.states.get(stationId);
    if (!state) {
      this.getState(stationId);
      return this.setFault(stationId, fault);
    }

    state.currentFault = fault;
    this.addLog(stationId, 'warning', `Fault detected: ${fault.type}`, { 
      faultId: fault.id, 
      severity: fault.severity 
    });

    // Automatically transition to CRITICAL if not already there
    if (state.phase === 'STABLE') {
      this.transitionTo(stationId, 'CRITICAL', { trigger: 'fault_detected', fault });
    }
  }

  setDiagnosis(stationId: string, diagnosis: DiagnosisResult): void {
    const state = this.states.get(stationId);
    if (!state) {
      this.getState(stationId);
      return this.setDiagnosis(stationId, diagnosis);
    }

    state.diagnosis = diagnosis;
    this.addLog(stationId, 'info', `Diagnosis complete: ${diagnosis.rootCause}`, {
      confidence: diagnosis.confidence,
      estimatedRecoveryTime: diagnosis.estimatedRecoveryTime
    });
  }

  setRecoveryPlan(stationId: string, plan: RecoveryPlan): void {
    const state = this.states.get(stationId);
    if (!state) {
      this.getState(stationId);
      return this.setRecoveryPlan(stationId, plan);
    }

    state.recoveryPlan = plan;
    this.addLog(stationId, 'info', `Recovery plan set`, {
      actionCount: plan.actions.length,
      estimatedDuration: plan.estimatedDuration
    });
  }

  reset(stationId: string): void {
    const newState = this.createInitialState(stationId);
    this.states.set(stationId, newState);
    this.addLog(stationId, 'info', 'Agent state reset to initial state');
  }

  onStateChange(callback: StateChangeCallback): void {
    this.stateChangeCallbacks.push(callback);
  }

  // Get logs for a specific station
  getLogs(stationId: string, level?: AgentLog['level']): AgentLog[] {
    const state = this.states.get(stationId);
    if (!state) {
      return [];
    }

    if (level) {
      return state.logs.filter(log => log.level === level);
    }
    return [...state.logs]; // Return copy
  }

  // Get current phase for a station
  getCurrentPhase(stationId: string): AgentState['phase'] {
    return this.getState(stationId).phase;
  }

  // Check if agent is active (not in STABLE state)
  isActive(stationId: string): boolean {
    return this.getCurrentPhase(stationId) !== 'STABLE';
  }

  // Get time since state started
  getTimeInCurrentState(stationId: string): number {
    const state = this.getState(stationId);
    return Date.now() - state.startTime;
  }

  // Clear completed cycle data while maintaining logs
  clearCycleData(stationId: string): void {
    const state = this.states.get(stationId);
    if (state) {
      state.currentFault = undefined;
      state.diagnosis = undefined;
      state.recoveryPlan = undefined;
      this.addLog(stationId, 'info', 'Cycle data cleared');
    }
  }

  private createInitialState(stationId: string): AgentState {
    return {
      phase: 'STABLE',
      stationId,
      startTime: Date.now(),
      logs: []
    };
  }

  private isValidTransition(from: AgentState['phase'], to: AgentState['phase']): boolean {
    // Allow staying in the same state
    if (from === to) {
      return true;
    }

    // Check if transition is in valid transitions list
    return this.VALID_TRANSITIONS.some(transition => 
      transition.from === from && transition.to === to
    );
  }

  private emitStateChange(stationId: string, oldState: AgentState['phase'], newState: AgentState['phase']): void {
    // Emit to all registered callbacks
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(stationId, oldState, newState);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  // Get all valid next states from current state
  getValidNextStates(stationId: string): AgentState['phase'][] {
    const currentPhase = this.getCurrentPhase(stationId);
    return this.VALID_TRANSITIONS
      .filter(transition => transition.from === currentPhase)
      .map(transition => transition.to);
  }

  // Get state transition history
  getStateHistory(stationId: string): Array<{ phase: AgentState['phase']; timestamp: number; message: string }> {
    const logs = this.getLogs(stationId, 'info');
    return logs
      .filter(log => log.message.includes('State transition:') || log.message.includes('Agent initialized'))
      .map(log => ({
        phase: log.data?.phase || 'UNKNOWN',
        timestamp: log.timestamp,
        message: log.message
      }));
  }
}

// Export singleton instance for convenience
export const agentStateManager = new AgentStateManagerImpl();