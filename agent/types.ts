// Core TypeScript interfaces for the Self-Healing AI Agent system

export interface AgentState {
  phase: 'STABLE' | 'CRITICAL' | 'DIAGNOSING' | 'EXECUTING' | 'RESOLVED';
  stationId: string;
  currentFault?: FaultEvent;
  diagnosis?: DiagnosisResult;
  recoveryPlan?: RecoveryPlan;
  startTime: number;
  logs: AgentLog[];
}

export interface TelemetryData {
  stationId: string;
  timestamp: number;
  voltage: number;        // 200-250V normal, outside range = fault
  current: number;        // 0-32A normal, spikes = fault
  temperature: number;    // 20-40°C normal, >60°C = overheat
  powerOutput: number;    // 0-7.4kW normal
  connectionStatus: 'connected' | 'disconnected' | 'error';
  chargingState: 'idle' | 'charging' | 'complete' | 'fault';
}

export interface FaultEvent {
  id: string;
  stationId: string;
  type: FaultType;
  severity: 'warning' | 'critical';
  detectedAt: number;
  telemetrySnapshot: TelemetryData;
  description: string;
}

export interface DiagnosisResult {
  faultId: string;
  rootCause: string;
  confidence: number;     // 0.0 - 1.0
  reasoning: string[];    // Step-by-step reasoning for UI display
  recommendedActions: string[];
  estimatedRecoveryTime: number; // milliseconds
}

export interface RecoveryResult {
  success: boolean;
  message: string;
  newState?: Partial<TelemetryData>;
  nextActions?: string[];
}

// Supporting types
export type FaultType = 
  | 'overvoltage' 
  | 'undervoltage' 
  | 'overcurrent' 
  | 'overtemperature' 
  | 'connection_lost' 
  | 'charging_stalled';

export interface RecoveryPlan {
  actions: RecoveryAction[];
  estimatedDuration: number;
  fallbackPlan?: RecoveryAction[];
}

export interface RecoveryAction {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number;
  execute: (stationId: string) => Promise<RecoveryResult>;
}

export interface AgentLog {
  timestamp: number;
  level: 'info' | 'warning' | 'error';
  message: string;
  data?: any;
}

export interface StateTransition {
  from: AgentState['phase'];
  to: AgentState['phase'];
  trigger: string;
  condition?: (state: AgentState) => boolean;
}

export interface FaultThresholds {
  voltage: { min: number; max: number };
  current: { max: number };
  temperature: { max: number };
  responseTime: number; // Max time for fault detection
}

export interface AgentConfig {
  stationId: string;
  enabled: boolean;
  faultThresholds: FaultThresholds;
  recoveryTimeout: number;
  uiSettings: {
    terminalAutoOpen: boolean;
    thinkingDelay: number;
    actionDelay: number;
  };
}