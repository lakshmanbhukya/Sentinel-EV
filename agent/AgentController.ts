// Agent Controller - Main orchestrator for the Self-Healing AI Agent system
// Coordinates telemetry→fault detection→diagnosis→recovery flow with 400ms cycle time

import { AgentState, TelemetryData, FaultEvent, DiagnosisResult, RecoveryResult } from './types.js';
import { telemetrySimulator } from './telemetrySimulator.js';
import { faultDetector } from './faultDetector.js';
import { diagnosisEngine } from './diagnosisEngine.js';
import { recoveryActions } from './recoveryActions.js';
import { agentState } from './agentState.js';
import { realTimeTelemetry } from './realTimeTelemetry.js';
import { performanceMonitor } from './performanceMonitor.js';
import { predictiveAnalytics } from './predictiveAnalytics.js';
import { securityMonitor } from './securityMonitor.js';

export interface AgentControllerConfig {
  maxConcurrentAgents: number;
  detectionCycleMs: number;
  maxRecoveryTimeMs: number;
  enablePredictiveAnalytics: boolean;
  enablePerformanceMonitoring: boolean;
  enableSecurityMonitoring: boolean;
}

export interface AgentMetrics {
  totalCycles: number;
  successfulRecoveries: number;
  averageCycleTime: number;
  faultsDetected: number;
  activeAgents: number;
  systemHealth: 'optimal' | 'degraded' | 'critical';
}

class AgentControllerImpl {
  private static instance: AgentControllerImpl | null = null;
  private isInitialized = false;
  private isRunning = false;
  
  private config: AgentControllerConfig = {
    maxConcurrentAgents: 5,
    detectionCycleMs: 2000,
    maxRecoveryTimeMs: 400,
    enablePredictiveAnalytics: true,
    enablePerformanceMonitoring: true,
    enableSecurityMonitoring: true
  };

  private activeAgents = new Map<string, {
    state: AgentState;
    cycleStartTime: number;
    telemetryHistory: TelemetryData[];
  }>();

  private metrics: AgentMetrics = {
    totalCycles: 0,
    successfulRecoveries: 0,
    averageCycleTime: 0,
    faultsDetected: 0,
    activeAgents: 0,
    systemHealth: 'optimal'
  };

  private cycleTimeHistory: number[] = [];
  private callbacks: {
    onAgentStateChange?: (stationId: string, state: AgentState) => void;
    onFaultDetected?: (fault: FaultEvent) => void;
    onRecoveryComplete?: (stationId: string, result: RecoveryResult) => void;
    onMetricsUpdate?: (metrics: AgentMetrics) => void;
  } = {};

  private isRunning = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(config?: Partial<AgentControllerConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  // Initialize the agent controller system
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Agent Controller already initialized');
      return;
    }

    console.log('🤖 Initializing Agent Controller System...');
    this.isInitialized = true;

    // Initialize monitoring systems
    if (this.config.enablePerformanceMonitoring) {
      performanceMonitor.startMonitoring(5000);
      console.log('📊 Performance monitoring initialized');
    }

    if (this.config.enableSecurityMonitoring) {
      securityMonitor.startMonitoring();
      console.log('🔒 Security monitoring initialized');
    }

    if (this.config.enablePredictiveAnalytics) {
      console.log('🔮 Predictive analytics initialized');
    }

    // Set up global fault detection callback
    realTimeTelemetry.onFaultDetected((fault) => {
      this.handleFaultDetected(fault);
    });

    console.log('✅ Agent Controller System initialized successfully');
  }

  // Start the agent controller
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Agent Controller already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Agent Controller started');

    // Start monitoring cycle
    this.monitoringInterval = setInterval(() => {
      this.performSystemHealthCheck();
      this.updateMetrics();
    }, this.config.detectionCycleMs);
  }

  // Stop the agent controller
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Agent Controller not running');
      return;
    }

    this.isRunning = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    // Stop all active agents
    for (const stationId of this.activeAgents.keys()) {
      this.stopAgent(stationId);
    }

    // Stop monitoring systems
    performanceMonitor.stopMonitoring();
    realTimeTelemetry.cleanup();

    console.log('🛑 Agent Controller stopped');
  }

  // Activate agent for a specific station
  async activateAgent(stationId: string, stationData: any): Promise<void> {
    if (this.activeAgents.has(stationId)) {
      console.log(`⚠️ Agent already active for station ${stationId}`);
      return;
    }

    if (this.activeAgents.size >= this.config.maxConcurrentAgents) {
      console.log(`⚠️ Maximum concurrent agents (${this.config.maxConcurrentAgents}) reached`);
      return;
    }

    console.log(`🔧 Activating agent for station ${stationId}`);

    // Initialize agent state
    const initialState: AgentState = {
      phase: 'STABLE',
      stationId,
      startTime: Date.now(),
      logs: [{
        timestamp: Date.now(),
        level: 'info',
        message: `Agent activated for station ${stationId}`
      }]
    };

    // Start real-time telemetry monitoring
    realTimeTelemetry.startMonitoring(stationId, stationData);

    // Add to active agents
    this.activeAgents.set(stationId, {
      state: initialState,
      cycleStartTime: Date.now(),
      telemetryHistory: []
    });

    // Update metrics
    this.metrics.activeAgents = this.activeAgents.size;

    // Notify callbacks
    this.callbacks.onAgentStateChange?.(stationId, initialState);

    console.log(`✅ Agent activated for station ${stationId}`);
  }

  // Deactivate agent for a specific station
  stopAgent(stationId: string): void {
    const agent = this.activeAgents.get(stationId);
    if (!agent) return;

    console.log(`🛑 Stopping agent for station ${stationId}`);

    // Stop telemetry monitoring
    realTimeTelemetry.stopMonitoring(stationId);

    // Remove from active agents
    this.activeAgents.delete(stationId);

    // Update metrics
    this.metrics.activeAgents = this.activeAgents.size;

    console.log(`✅ Agent stopped for station ${stationId}`);
  }

  // Handle fault detection and trigger recovery cycle
  private async handleFaultDetected(fault: FaultEvent): Promise<void> {
    const cycleStartTime = performance.now();
    console.log(`🚨 Fault detected: ${fault.description}`);

    this.metrics.faultsDetected++;
    this.callbacks.onFaultDetected?.(fault);

    const agent = this.activeAgents.get(fault.stationId);
    if (!agent) {
      console.log(`⚠️ No active agent for station ${fault.stationId}`);
      return;
    }

    // Check if agent is already processing a fault - prevent duplicate processing
    if (agent.state.phase !== 'STABLE') {
      console.log(`⚠️ Agent for station ${fault.stationId} is already processing (phase: ${agent.state.phase})`);
      return;
    }

    try {
      // Phase 1: Update agent to CRITICAL state
      await this.updateAgentState(fault.stationId, {
        phase: 'CRITICAL',
        currentFault: fault
      });

      // Phase 2: Diagnosis
      await this.updateAgentState(fault.stationId, { phase: 'DIAGNOSING' });
      
      const telemetryHistory = agent.telemetryHistory.slice(-10); // Last 10 readings
      const diagnosis = await diagnosisEngine.diagnose(fault, telemetryHistory);
      
      await this.updateAgentState(fault.stationId, { diagnosis });

      // Phase 3: Recovery execution
      await this.updateAgentState(fault.stationId, { phase: 'EXECUTING' });
      
      const recoveryResult = await recoveryActions.executeRecovery(diagnosis);
      
      // Phase 4: Resolution
      if (recoveryResult.success) {
        await this.updateAgentState(fault.stationId, { 
          phase: 'RESOLVED',
          recoveryResult 
        });
        
        this.metrics.successfulRecoveries++;
        this.callbacks.onRecoveryComplete?.(fault.stationId, recoveryResult);
        
        // CRITICAL FIX: Stop telemetry monitoring after successful recovery
        // This prevents the agent from immediately re-detecting the same fault
        console.log(`✅ Recovery successful - stopping telemetry monitoring for station ${fault.stationId}`);
        realTimeTelemetry.stopMonitoring(fault.stationId);
        
        // Return to stable and then stop the agent
        setTimeout(async () => {
          await this.updateAgentState(fault.stationId, { phase: 'STABLE' });
          
          // Stop the agent completely after recovery
          setTimeout(() => {
            this.stopAgent(fault.stationId);
          }, 2000);
        }, 3000);
      } else {
        // Recovery failed - escalate or retry
        console.log(`❌ Recovery failed for station ${fault.stationId}: ${recoveryResult.message}`);
        await this.updateAgentState(fault.stationId, { 
          phase: 'CRITICAL',
          recoveryResult 
        });
      }

      // Record cycle time
      const cycleTime = performance.now() - cycleStartTime;
      this.recordCycleTime(cycleTime);
      this.metrics.totalCycles++;

      console.log(`⏱️ Recovery cycle completed in ${cycleTime.toFixed(1)}ms`);

    } catch (error) {
      console.error(`💥 Error in recovery cycle for station ${fault.stationId}:`, error);
      await this.updateAgentState(fault.stationId, { 
        phase: 'CRITICAL',
        logs: [...agent.state.logs, {
          timestamp: Date.now(),
          level: 'error',
          message: `Recovery cycle failed: ${error}`
        }]
      });
    }
  }

  // Update agent state and notify callbacks
  private async updateAgentState(stationId: string, updates: Partial<AgentState>): Promise<void> {
    const agent = this.activeAgents.get(stationId);
    if (!agent) return;

    const updatedState: AgentState = {
      ...agent.state,
      ...updates,
      logs: updates.logs || [
        ...agent.state.logs,
        {
          timestamp: Date.now(),
          level: 'info',
          message: `State transition: ${agent.state.phase} → ${updates.phase || agent.state.phase}`
        }
      ]
    };

    agent.state = updatedState;
    this.callbacks.onAgentStateChange?.(stationId, updatedState);

    // Add small delay for realistic timing
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Record cycle time for performance metrics
  private recordCycleTime(cycleTime: number): void {
    this.cycleTimeHistory.push(cycleTime);
    
    // Keep only last 100 cycle times
    if (this.cycleTimeHistory.length > 100) {
      this.cycleTimeHistory.shift();
    }

    // Update average cycle time
    this.metrics.averageCycleTime = this.cycleTimeHistory.reduce((sum, time) => sum + time, 0) / this.cycleTimeHistory.length;
  }

  // Perform system health check
  private performSystemHealthCheck(): void {
    // Update telemetry history for all active agents
    for (const [stationId, agent] of this.activeAgents) {
      const currentTelemetry = realTimeTelemetry.getCurrentTelemetry(stationId);
      if (currentTelemetry) {
        agent.telemetryHistory.push(currentTelemetry);
        
        // Keep only last 50 telemetry readings
        if (agent.telemetryHistory.length > 50) {
          agent.telemetryHistory.shift();
        }

        // Add telemetry to predictive analytics
        if (this.config.enablePredictiveAnalytics) {
          predictiveAnalytics.addTelemetryData(currentTelemetry);
        }
      }
    }

    // Update system health based on various factors
    const criticalAgents = Array.from(this.activeAgents.values()).filter(
      agent => agent.state.phase === 'CRITICAL'
    ).length;

    const avgCycleTime = this.metrics.averageCycleTime;
    const successRate = this.metrics.totalCycles > 0 ? 
      (this.metrics.successfulRecoveries / this.metrics.totalCycles) : 1;

    if (criticalAgents > 2 || avgCycleTime > 500 || successRate < 0.8) {
      this.metrics.systemHealth = 'critical';
    } else if (criticalAgents > 0 || avgCycleTime > 300 || successRate < 0.95) {
      this.metrics.systemHealth = 'degraded';
    } else {
      this.metrics.systemHealth = 'optimal';
    }
  }

  // Update and notify metrics
  private updateMetrics(): void {
    this.callbacks.onMetricsUpdate?.(this.metrics);
  }

  // Public API methods
  getActiveAgents(): Map<string, AgentState> {
    const result = new Map<string, AgentState>();
    for (const [stationId, agent] of this.activeAgents) {
      result.set(stationId, agent.state);
    }
    return result;
  }

  getMetrics(): AgentMetrics {
    return { ...this.metrics };
  }

  getAgentState(stationId: string): AgentState | null {
    return this.activeAgents.get(stationId)?.state || null;
  }

  // Event callbacks
  onAgentStateChange(callback: (stationId: string, state: AgentState) => void): void {
    this.callbacks.onAgentStateChange = callback;
  }

  onFaultDetected(callback: (fault: FaultEvent) => void): void {
    this.callbacks.onFaultDetected = callback;
  }

  onRecoveryComplete(callback: (stationId: string, result: RecoveryResult) => void): void {
    this.callbacks.onRecoveryComplete = callback;
  }

  onMetricsUpdate(callback: (metrics: AgentMetrics) => void): void {
    this.callbacks.onMetricsUpdate = callback;
  }

  // Configuration methods
  updateConfig(config: Partial<AgentControllerConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('🔧 Agent Controller configuration updated:', config);
  }

  getConfig(): AgentControllerConfig {
    return { ...this.config };
  }

  // Demo and testing methods
  async triggerDemoScenario(stationId: string, faultType: 'overvoltage' | 'overcurrent' | 'overtemperature'): Promise<void> {
    console.log(`🎭 Triggering demo scenario: ${faultType} for station ${stationId}`);
    
    const agent = this.activeAgents.get(stationId);
    if (!agent) {
      console.log(`⚠️ No active agent for station ${stationId}`);
      return;
    }

    // Inject fault into telemetry simulator
    telemetrySimulator.injectFault(stationId, faultType);
    
    console.log(`✅ Demo scenario triggered: ${faultType}`);
  }

  async resetSystem(): Promise<void> {
    console.log('🔄 Resetting agent controller system...');
    
    // Stop all agents
    for (const stationId of this.activeAgents.keys()) {
      this.stopAgent(stationId);
    }

    // Reset metrics
    this.metrics = {
      totalCycles: 0,
      successfulRecoveries: 0,
      averageCycleTime: 0,
      faultsDetected: 0,
      activeAgents: 0,
      systemHealth: 'optimal'
    };

    this.cycleTimeHistory = [];
    this.isInitialized = false;

    console.log('✅ System reset completed');
  }

  // Get singleton instance
  static getInstance(): AgentControllerImpl {
    if (!AgentControllerImpl.instance) {
      AgentControllerImpl.instance = new AgentControllerImpl();
    }
    return AgentControllerImpl.instance;
  }
}

// Export singleton instance
export const agentController = AgentControllerImpl.getInstance();