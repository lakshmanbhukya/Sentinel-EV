// Recovery Actions for Self-Healing AI Agent
// Executes automated recovery procedures based on diagnosis results

import { DiagnosisResult, RecoveryResult, FaultType, RecoveryAction, TelemetryData } from './types.js';

export interface RecoveryActions {
  executeRecovery(diagnosis: DiagnosisResult): Promise<RecoveryResult>;
  getAvailableActions(faultType: FaultType): RecoveryAction[];
  registerAction(action: RecoveryAction): void;
  getRecoveryHistory(stationId: string): RecoveryAttempt[];
}

interface RecoveryAttempt {
  id: string;
  stationId: string;
  faultId: string;
  actionId: string;
  startTime: number;
  endTime?: number;
  result?: RecoveryResult;
  escalationLevel: number;
}

interface RecoveryContext {
  stationId: string;
  faultType: FaultType;
  diagnosis: DiagnosisResult;
  previousAttempts: RecoveryAttempt[];
  escalationLevel: number;
}

export class RecoveryActionsImpl implements RecoveryActions {
  private actions = new Map<FaultType, RecoveryAction[]>();
  private recoveryHistory = new Map<string, RecoveryAttempt[]>();
  private stationStates = new Map<string, Partial<TelemetryData>>();
  
  constructor() {
    this.initializeDefaultActions();
  }

  async executeRecovery(diagnosis: DiagnosisResult): Promise<RecoveryResult> {
    const stationId = this.extractStationId(diagnosis.faultId);
    const faultType = this.extractFaultType(diagnosis);
    
    const context = this.buildRecoveryContext(stationId, faultType, diagnosis);
    
    // Get appropriate recovery action based on diagnosis and escalation level
    const selectedAction = this.selectRecoveryAction(context);
    
    if (!selectedAction) {
      return this.createFailureResult('No suitable recovery action found', context);
    }

    // Record recovery attempt
    const attempt = this.recordRecoveryAttempt(stationId, diagnosis.faultId, selectedAction.id, context.escalationLevel);
    
    try {
      // Execute the recovery action
      const result = await this.executeAction(selectedAction, stationId, context);
      
      // Update attempt with result
      attempt.endTime = Date.now();
      attempt.result = result;
      
      // Update station state if recovery was successful
      if (result.success && result.newState) {
        this.updateStationState(stationId, result.newState);
      }
      
      return result;
      
    } catch (error) {
      const errorResult = this.createFailureResult(
        `Recovery action failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context
      );
      
      attempt.endTime = Date.now();
      attempt.result = errorResult;
      
      return errorResult;
    }
  }

  getAvailableActions(faultType: FaultType): RecoveryAction[] {
    return this.actions.get(faultType) || [];
  }

  registerAction(action: RecoveryAction): void {
    // Extract fault type from action name or use a mapping
    const faultType = this.determineFaultTypeFromAction(action);
    
    if (!this.actions.has(faultType)) {
      this.actions.set(faultType, []);
    }
    
    this.actions.get(faultType)!.push(action);
  }

  getRecoveryHistory(stationId: string): RecoveryAttempt[] {
    return this.recoveryHistory.get(stationId) || [];
  }

  private initializeDefaultActions(): void {
    // Overvoltage recovery actions
    this.registerAction({
      id: 'voltage-regulation-reset',
      name: 'Reset Voltage Regulation',
      description: 'Reset voltage regulator and recalibrate output levels',
      estimatedDuration: 2000,
      execute: async (stationId: string) => {
        await this.simulateDelay(1500);
        return {
          success: true,
          message: 'Voltage regulator reset successfully',
          newState: { voltage: 230 },
          nextActions: ['Monitor voltage stability for 30 seconds']
        };
      }
    });

    this.registerAction({
      id: 'grid-isolation-temporary',
      name: 'Temporary Grid Isolation',
      description: 'Temporarily isolate from grid and switch to backup power',
      estimatedDuration: 3000,
      execute: async (stationId: string) => {
        await this.simulateDelay(2500);
        return {
          success: true,
          message: 'Switched to backup power, grid isolated',
          newState: { voltage: 225, powerOutput: 3.0 },
          nextActions: ['Monitor grid stability', 'Prepare for grid reconnection']
        };
      }
    });

    this.registerAction({
      id: 'voltage-limiter-activation',
      name: 'Activate Voltage Limiter',
      description: 'Enable voltage limiting circuit to cap maximum output',
      estimatedDuration: 1500,
      execute: async (stationId: string) => {
        await this.simulateDelay(1200);
        return {
          success: true,
          message: 'Voltage limiter activated, output capped at 240V',
          newState: { voltage: 240 },
          nextActions: ['Monitor voltage levels', 'Check for grid stability']
        };
      }
    });

    // Undervoltage recovery actions
    this.registerAction({
      id: 'backup-power-activation',
      name: 'Activate Backup Power',
      description: 'Switch to backup power source to maintain voltage levels',
      estimatedDuration: 2500,
      execute: async (stationId: string) => {
        await this.simulateDelay(2000);
        return {
          success: true,
          message: 'Backup power activated, voltage stabilized',
          newState: { voltage: 220, powerOutput: 4.0 },
          nextActions: ['Monitor backup power levels', 'Check grid recovery']
        };
      }
    });

    this.registerAction({
      id: 'charging-rate-reduction',
      name: 'Reduce Charging Rate',
      description: 'Lower charging current to reduce voltage drop',
      estimatedDuration: 1000,
      execute: async (stationId: string) => {
        await this.simulateDelay(800);
        return {
          success: true,
          message: 'Charging rate reduced to maintain voltage stability',
          newState: { current: 12, voltage: 215, powerOutput: 2.6 },
          nextActions: ['Monitor voltage recovery', 'Gradually increase rate if stable']
        };
      }
    });

    this.registerAction({
      id: 'connection-integrity-check',
      name: 'Check Connection Integrity',
      description: 'Verify and clean charging connections to reduce resistance',
      estimatedDuration: 3500,
      execute: async (stationId: string) => {
        await this.simulateDelay(3000);
        const success = Math.random() > 0.2; // 80% success rate
        return {
          success,
          message: success ? 'Connections cleaned and verified' : 'Connection issues detected, manual intervention required',
          newState: success ? { voltage: 225 } : undefined,
          nextActions: success ? ['Resume normal charging'] : ['Request maintenance inspection']
        };
      }
    });

    // Overcurrent recovery actions
    this.registerAction({
      id: 'circuit-isolation-immediate',
      name: 'Immediate Circuit Isolation',
      description: 'Immediately isolate charging circuit for safety',
      estimatedDuration: 500,
      execute: async (stationId: string) => {
        await this.simulateDelay(300);
        return {
          success: true,
          message: 'Circuit isolated for safety, current flow stopped',
          newState: { current: 0, powerOutput: 0, chargingState: 'fault' },
          nextActions: ['Inspect charging cables', 'Check for short circuits', 'Reset protection systems']
        };
      }
    });

    this.registerAction({
      id: 'current-limiting-activation',
      name: 'Activate Current Limiting',
      description: 'Enable current limiting to prevent overcurrent conditions',
      estimatedDuration: 1500,
      execute: async (stationId: string) => {
        await this.simulateDelay(1200);
        return {
          success: true,
          message: 'Current limiter activated, maximum current set to 25A',
          newState: { current: 25, powerOutput: 5.75 },
          nextActions: ['Monitor current levels', 'Check vehicle charging behavior']
        };
      }
    });

    this.registerAction({
      id: 'charging-session-restart',
      name: 'Restart Charging Session',
      description: 'Reset charging session and reinitialize vehicle communication',
      estimatedDuration: 4000,
      execute: async (stationId: string) => {
        await this.simulateDelay(3500);
        return {
          success: true,
          message: 'Charging session restarted, vehicle communication reestablished',
          newState: { current: 16, chargingState: 'charging' },
          nextActions: ['Monitor charging stability', 'Verify vehicle BMS communication']
        };
      }
    });

    // Overtemperature recovery actions
    this.registerAction({
      id: 'emergency-cooling-activation',
      name: 'Activate Emergency Cooling',
      description: 'Enable emergency cooling systems to reduce temperature',
      estimatedDuration: 5000,
      execute: async (stationId: string) => {
        await this.simulateDelay(4500);
        return {
          success: true,
          message: 'Emergency cooling activated, temperature decreasing',
          newState: { temperature: 45 },
          nextActions: ['Monitor temperature reduction', 'Check cooling system status']
        };
      }
    });

    this.registerAction({
      id: 'power-output-reduction',
      name: 'Reduce Power Output',
      description: 'Lower power output to reduce heat generation',
      estimatedDuration: 1500,
      execute: async (stationId: string) => {
        await this.simulateDelay(1200);
        return {
          success: true,
          message: 'Power output reduced to 50% to manage temperature',
          newState: { current: 8, powerOutput: 1.8, temperature: 55 },
          nextActions: ['Monitor temperature stabilization', 'Gradually increase power if temperature allows']
        };
      }
    });

    this.registerAction({
      id: 'cooling-system-reset',
      name: 'Reset Cooling System',
      description: 'Reset and restart cooling system components',
      estimatedDuration: 6000,
      execute: async (stationId: string) => {
        await this.simulateDelay(5500);
        const success = Math.random() > 0.15; // 85% success rate
        return {
          success,
          message: success ? 'Cooling system reset and operational' : 'Cooling system requires maintenance',
          newState: success ? { temperature: 35 } : undefined,
          nextActions: success ? ['Resume normal operation'] : ['Schedule cooling system maintenance']
        };
      }
    });

    // Connection lost recovery actions
    this.registerAction({
      id: 'connection-reset-sequence',
      name: 'Connection Reset Sequence',
      description: 'Reset connection and reinitialize communication protocols',
      estimatedDuration: 3000,
      execute: async (stationId: string) => {
        await this.simulateDelay(2500);
        const success = Math.random() > 0.25; // 75% success rate
        return {
          success,
          message: success ? 'Connection reestablished successfully' : 'Connection reset failed, check physical connection',
          newState: success ? { connectionStatus: 'connected' } : { connectionStatus: 'error' },
          nextActions: success ? ['Resume charging session'] : ['Check cable connection', 'Verify charging port']
        };
      }
    });

    this.registerAction({
      id: 'cable-integrity-verification',
      name: 'Verify Cable Integrity',
      description: 'Check charging cable for physical damage or disconnection',
      estimatedDuration: 2000,
      execute: async (stationId: string) => {
        await this.simulateDelay(1800);
        const success = Math.random() > 0.3; // 70% success rate
        return {
          success,
          message: success ? 'Cable integrity verified, connection restored' : 'Cable issue detected, manual intervention required',
          newState: success ? { connectionStatus: 'connected' } : undefined,
          nextActions: success ? ['Resume charging'] : ['Replace or repair charging cable']
        };
      }
    });

    this.registerAction({
      id: 'communication-protocol-reset',
      name: 'Reset Communication Protocol',
      description: 'Reset control pilot and communication systems',
      estimatedDuration: 3500,
      execute: async (stationId: string) => {
        await this.simulateDelay(3000);
        return {
          success: true,
          message: 'Communication protocol reset, control pilot signal restored',
          newState: { connectionStatus: 'connected' },
          nextActions: ['Verify vehicle communication', 'Restart charging protocol']
        };
      }
    });

    // Charging stalled recovery actions
    this.registerAction({
      id: 'charging-completion-verification',
      name: 'Verify Charging Completion',
      description: 'Check if charging stalled due to battery being full',
      estimatedDuration: 1000,
      execute: async (stationId: string) => {
        await this.simulateDelay(800);
        const batteryFull = Math.random() > 0.4; // 60% chance battery is full
        return {
          success: true,
          message: batteryFull ? 'Charging completed - battery full' : 'Charging incomplete - system issue detected',
          newState: batteryFull ? { chargingState: 'complete' } : { chargingState: 'fault' },
          nextActions: batteryFull ? ['Prepare for disconnection', 'Update session status'] : ['Run system diagnostics', 'Reset charging system']
        };
      }
    });

    this.registerAction({
      id: 'charging-system-diagnostics',
      name: 'Run Charging System Diagnostics',
      description: 'Perform comprehensive diagnostics on charging system',
      estimatedDuration: 4500,
      execute: async (stationId: string) => {
        await this.simulateDelay(4000);
        const diagnosticsPass = Math.random() > 0.2; // 80% pass rate
        return {
          success: diagnosticsPass,
          message: diagnosticsPass ? 'Diagnostics passed, system operational' : 'Diagnostics failed, component replacement needed',
          newState: diagnosticsPass ? { chargingState: 'charging', current: 16 } : undefined,
          nextActions: diagnosticsPass ? ['Resume charging session'] : ['Schedule maintenance', 'Replace faulty components']
        };
      }
    });

    this.registerAction({
      id: 'charging-system-full-reset',
      name: 'Full Charging System Reset',
      description: 'Complete reset of all charging system components',
      estimatedDuration: 6000,
      execute: async (stationId: string) => {
        await this.simulateDelay(5500);
        return {
          success: true,
          message: 'Charging system fully reset and reinitialized',
          newState: { 
            chargingState: 'charging', 
            current: 16, 
            voltage: 230, 
            temperature: 25,
            connectionStatus: 'connected'
          },
          nextActions: ['Monitor system stability', 'Verify all parameters normal']
        };
      }
    });
  }

  private buildRecoveryContext(stationId: string, faultType: FaultType, diagnosis: DiagnosisResult): RecoveryContext {
    const previousAttempts = this.getRecoveryHistory(stationId)
      .filter(attempt => attempt.faultId === diagnosis.faultId);
    
    const escalationLevel = this.calculateEscalationLevel(previousAttempts);
    
    return {
      stationId,
      faultType,
      diagnosis,
      previousAttempts,
      escalationLevel
    };
  }

  private selectRecoveryAction(context: RecoveryContext): RecoveryAction | null {
    const availableActions = this.getAvailableActions(context.faultType);
    
    if (availableActions.length === 0) {
      return null;
    }

    // Filter out actions that have already been tried
    const triedActionIds = context.previousAttempts.map(attempt => attempt.actionId);
    const untriedActions = availableActions.filter(action => !triedActionIds.includes(action.id));
    
    // If we have untried actions, select based on diagnosis confidence and escalation level
    if (untriedActions.length > 0) {
      return this.selectBestAction(untriedActions, context);
    }
    
    // If all actions have been tried, escalate to more comprehensive actions
    return this.selectEscalationAction(availableActions, context);
  }

  private selectBestAction(actions: RecoveryAction[], context: RecoveryContext): RecoveryAction {
    // Sort actions by estimated duration (faster actions first for high confidence)
    // or by comprehensiveness (thorough actions first for low confidence)
    
    if (context.diagnosis.confidence > 0.8) {
      // High confidence: try quick, targeted actions first
      return actions.sort((a, b) => a.estimatedDuration - b.estimatedDuration)[0];
    } else {
      // Low confidence: try comprehensive actions
      return actions.sort((a, b) => b.estimatedDuration - a.estimatedDuration)[0];
    }
  }

  private selectEscalationAction(actions: RecoveryAction[], context: RecoveryContext): RecoveryAction {
    // Select the most comprehensive action for escalation
    return actions.sort((a, b) => b.estimatedDuration - a.estimatedDuration)[0];
  }

  private async executeAction(action: RecoveryAction, stationId: string, context: RecoveryContext): Promise<RecoveryResult> {
    // Execute the action with context
    const result = await action.execute(stationId);
    
    // Add escalation information if this is a retry
    if (context.escalationLevel > 0) {
      result.message += ` (Escalation level ${context.escalationLevel})`;
      
      if (!result.success && context.escalationLevel < 3) {
        result.nextActions = result.nextActions || [];
        result.nextActions.push('Escalate to next recovery level');
      }
    }
    
    return result;
  }

  private recordRecoveryAttempt(stationId: string, faultId: string, actionId: string, escalationLevel: number): RecoveryAttempt {
    const attempt: RecoveryAttempt = {
      id: `recovery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      stationId,
      faultId,
      actionId,
      startTime: Date.now(),
      escalationLevel
    };
    
    if (!this.recoveryHistory.has(stationId)) {
      this.recoveryHistory.set(stationId, []);
    }
    
    this.recoveryHistory.get(stationId)!.push(attempt);
    
    // Keep only last 50 attempts per station
    const history = this.recoveryHistory.get(stationId)!;
    if (history.length > 50) {
      this.recoveryHistory.set(stationId, history.slice(-50));
    }
    
    return attempt;
  }

  private calculateEscalationLevel(previousAttempts: RecoveryAttempt[]): number {
    const failedAttempts = previousAttempts.filter(attempt => 
      attempt.result && !attempt.result.success
    );
    
    return Math.min(failedAttempts.length, 3); // Max escalation level of 3
  }

  private updateStationState(stationId: string, newState: Partial<TelemetryData>): void {
    const currentState = this.stationStates.get(stationId) || {};
    this.stationStates.set(stationId, { ...currentState, ...newState });
  }

  private createFailureResult(message: string, context: RecoveryContext): RecoveryResult {
    return {
      success: false,
      message,
      nextActions: context.escalationLevel < 3 
        ? ['Escalate to next recovery level', 'Request manual intervention']
        : ['Request immediate manual intervention', 'Contact maintenance team']
    };
  }

  private extractStationId(faultId: string): string {
    // Extract station ID from fault ID format: "stationId-faultType-timestamp"
    return faultId.split('-')[0];
  }

  private extractFaultType(diagnosis: DiagnosisResult): FaultType {
    // Determine fault type from diagnosis or fault ID
    const faultId = diagnosis.faultId;
    const parts = faultId.split('-');
    
    if (parts.length >= 2) {
      const faultTypePart = parts[1];
      const validFaultTypes: FaultType[] = ['overvoltage', 'undervoltage', 'overcurrent', 'overtemperature', 'connection_lost', 'charging_stalled'];
      
      if (validFaultTypes.includes(faultTypePart as FaultType)) {
        return faultTypePart as FaultType;
      }
    }
    
    // Fallback: try to determine from root cause
    const rootCause = diagnosis.rootCause.toLowerCase();
    if (rootCause.includes('voltage') && rootCause.includes('high')) return 'overvoltage';
    if (rootCause.includes('voltage') && rootCause.includes('low')) return 'undervoltage';
    if (rootCause.includes('current')) return 'overcurrent';
    if (rootCause.includes('temperature') || rootCause.includes('heat')) return 'overtemperature';
    if (rootCause.includes('connection') || rootCause.includes('cable')) return 'connection_lost';
    if (rootCause.includes('charging') || rootCause.includes('stall')) return 'charging_stalled';
    
    // Default fallback
    return 'charging_stalled';
  }

  private determineFaultTypeFromAction(action: RecoveryAction): FaultType {
    const actionName = action.name.toLowerCase();
    const actionDesc = action.description.toLowerCase();
    const combined = `${actionName} ${actionDesc}`;
    
    if (combined.includes('voltage') && (combined.includes('high') || combined.includes('surge') || combined.includes('regulator'))) {
      return 'overvoltage';
    }
    if (combined.includes('voltage') && (combined.includes('low') || combined.includes('backup') || combined.includes('sag'))) {
      return 'undervoltage';
    }
    if (combined.includes('current') || combined.includes('circuit') || combined.includes('isolation')) {
      return 'overcurrent';
    }
    if (combined.includes('temperature') || combined.includes('cooling') || combined.includes('heat')) {
      return 'overtemperature';
    }
    if (combined.includes('connection') || combined.includes('cable') || combined.includes('communication')) {
      return 'connection_lost';
    }
    
    return 'charging_stalled'; // Default
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get current station state (for testing and monitoring)
  getStationState(stationId: string): Partial<TelemetryData> | undefined {
    return this.stationStates.get(stationId);
  }

  // Clear recovery history (for testing)
  clearHistory(stationId: string): void {
    this.recoveryHistory.delete(stationId);
    this.stationStates.delete(stationId);
  }
}

// Export singleton instance for convenience
export const recoveryActions = new RecoveryActionsImpl();