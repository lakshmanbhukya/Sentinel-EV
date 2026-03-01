// Agent Enabled Wrapper Component
// Provides conditional rendering and state management for agent features
// Ensures existing functionality remains unchanged when agent is inactive

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { StationAgentIntegration } from './StationAgentIntegration.js';
import { SystemIntelligenceLayer } from '../ui/SystemIntelligenceLayer.js';
import { AgentState, FaultEvent } from '../types.js';

interface AgentContextValue {
  // Global agent settings
  isAgentEnabled: boolean;
  enableAgent: () => void;
  disableAgent: () => void;
  toggleAgent: () => void;
  
  // Per-station agent state
  stationAgentStates: Map<string, AgentState>;
  isStationAgentActive: (stationId: string) => boolean;
  activateStationAgent: (stationId: string) => void;
  deactivateStationAgent: (stationId: string) => void;
  
  // Agent configuration
  agentConfig: AgentConfig;
  updateAgentConfig: (config: Partial<AgentConfig>) => void;
  
  // Event handlers
  onAgentStateChange?: (stationId: string, agentState: AgentState) => void;
  onFaultDetected?: (fault: FaultEvent) => void;
}

interface AgentConfig {
  autoActivateOnCritical: boolean;
  monitoringInterval: number;
  maxConcurrentAgents: number;
  enableTerminalUI: boolean;
  enableBackgroundMonitoring: boolean;
}

const defaultAgentConfig: AgentConfig = {
  autoActivateOnCritical: true,
  monitoringInterval: 2000,
  maxConcurrentAgents: 5,
  enableTerminalUI: true,
  enableBackgroundMonitoring: true
};

const AgentContext = createContext<AgentContextValue | null>(null);

export interface AgentEnabledWrapperProps {
  children: ReactNode;
  initialEnabled?: boolean;
  initialConfig?: Partial<AgentConfig>;
  onAgentStateChange?: (stationId: string, agentState: AgentState) => void;
  onFaultDetected?: (fault: FaultEvent) => void;
}

export const AgentEnabledWrapper: React.FC<AgentEnabledWrapperProps> = ({
  children,
  initialEnabled = false,
  initialConfig = {},
  onAgentStateChange,
  onFaultDetected
}) => {
  const [isAgentEnabled, setIsAgentEnabled] = useState(initialEnabled);
  const [stationAgentStates, setStationAgentStates] = useState<Map<string, AgentState>>(new Map());
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    ...defaultAgentConfig,
    ...initialConfig
  });

  const enableAgent = useCallback(() => {
    setIsAgentEnabled(true);
  }, []);

  const disableAgent = useCallback(() => {
    setIsAgentEnabled(false);
    // Clear all station agent states when disabling
    setStationAgentStates(new Map());
  }, []);

  const toggleAgent = useCallback(() => {
    setIsAgentEnabled(prev => !prev);
    if (isAgentEnabled) {
      setStationAgentStates(new Map());
    }
  }, [isAgentEnabled]);

  const isStationAgentActive = useCallback((stationId: string) => {
    return isAgentEnabled && stationAgentStates.has(stationId);
  }, [isAgentEnabled, stationAgentStates]);

  const activateStationAgent = useCallback((stationId: string) => {
    if (!isAgentEnabled) return;
    
    // Initialize agent state for station
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

    setStationAgentStates(prev => new Map(prev).set(stationId, initialState));
  }, [isAgentEnabled]);

  const deactivateStationAgent = useCallback((stationId: string) => {
    setStationAgentStates(prev => {
      const newMap = new Map(prev);
      newMap.delete(stationId);
      return newMap;
    });
  }, []);

  const updateAgentConfig = useCallback((config: Partial<AgentConfig>) => {
    setAgentConfig(prev => ({ ...prev, ...config }));
  }, []);

  const handleAgentStateChange = useCallback((stationId: string, agentState: AgentState) => {
    setStationAgentStates(prev => new Map(prev).set(stationId, agentState));
    onAgentStateChange?.(stationId, agentState);
  }, [onAgentStateChange]);

  const contextValue: AgentContextValue = {
    isAgentEnabled,
    enableAgent,
    disableAgent,
    toggleAgent,
    stationAgentStates,
    isStationAgentActive,
    activateStationAgent,
    deactivateStationAgent,
    agentConfig,
    updateAgentConfig,
    onAgentStateChange: handleAgentStateChange,
    onFaultDetected
  };

  return (
    <AgentContext.Provider value={contextValue}>
      {children}
    </AgentContext.Provider>
  );
};

// Hook to access agent context
export const useAgentContext = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgentContext must be used within an AgentEnabledWrapper');
  }
  return context;
};

// Hook for conditional agent features
export const useConditionalAgent = (stationId?: string) => {
  const context = useContext(AgentContext);
  
  // Return safe defaults if no context (agent not enabled)
  if (!context) {
    return {
      isAgentEnabled: false,
      isStationAgentActive: false,
      agentState: undefined,
      activateAgent: () => {},
      deactivateAgent: () => {},
      toggleAgent: () => {}
    };
  }

  const {
    isAgentEnabled,
    stationAgentStates,
    isStationAgentActive,
    activateStationAgent,
    deactivateStationAgent,
    toggleAgent
  } = context;

  return {
    isAgentEnabled,
    isStationAgentActive: stationId ? isStationAgentActive(stationId) : false,
    agentState: stationId ? stationAgentStates.get(stationId) : undefined,
    activateAgent: stationId ? () => activateStationAgent(stationId) : () => {},
    deactivateAgent: stationId ? () => deactivateStationAgent(stationId) : () => {},
    toggleAgent
  };
};

// Component for integrating agent with existing station UI
export interface AgentIntegrationProps {
  selectedStation?: {
    id: string;
    name: string;
    status: 'safe' | 'warning' | 'critical';
    temp: number;
    load: number;
    lat: number;
    lng: number;
  } | null;
  allStations?: {
    id: string;
    name: string;
    status: 'safe' | 'warning' | 'critical';
    temp: number;
    load: number;
    lat: number;
    lng: number;
  }[];
  onStationStatusChange?: (stationId: string, newStatus: 'safe' | 'warning' | 'critical') => void;
}

export const AgentIntegration: React.FC<AgentIntegrationProps> = ({ 
  selectedStation, 
  allStations = [],
  onStationStatusChange 
}) => {
  const context = useContext(AgentContext);
  
  // Don't render anything if agent context is not available
  if (!context) {
    return null;
  }

  const {
    isAgentEnabled,
    agentConfig,
    onAgentStateChange,
    onFaultDetected
  } = context;

  // Don't render if agent is disabled
  if (!isAgentEnabled) {
    return null;
  }

  // Use direct import instead of lazy loading to prevent re-mounting
  return (
    <SystemIntelligenceLayer
      selectedStation={selectedStation}
      allStations={allStations}
      enabled={isAgentEnabled}
      autoActivateOnCritical={agentConfig.autoActivateOnCritical}
      monitoringInterval={agentConfig.monitoringInterval}
      maxConcurrentAgents={agentConfig.maxConcurrentAgents}
      onAgentActivated={onAgentStateChange}
      onFaultDetected={onFaultDetected}
      onStationStatusChange={onStationStatusChange}
    />
  );
};

// Agent Control Panel Component (optional UI for enabling/disabling agent)
export const AgentControlPanel: React.FC<{
  className?: string;
  showConfig?: boolean;
}> = ({ className = '', showConfig = false }) => {
  const {
    isAgentEnabled,
    toggleAgent,
    agentConfig,
    updateAgentConfig,
    stationAgentStates
  } = useAgentContext();

  const activeAgentCount = stationAgentStates.size;
  
  // Determine system health based on agent states
  const systemHealth = React.useMemo(() => {
    const agents = Array.from(stationAgentStates.values());
    const criticalAgents = agents.filter(state => state.phase === 'CRITICAL');
    const activeAgents = agents.filter(state => state.phase !== 'STABLE');
    
    if (criticalAgents.length > 0) return 'critical';
    if (activeAgents.length > 0) return 'responding';
    if (agents.length > 0) return 'monitoring';
    return 'optimal';
  }, [stationAgentStates]);

  // Use the new sophisticated system status indicator
  const SystemStatusIndicator = React.lazy(() => 
    import('../ui/SystemStatusIndicator.js').then(module => ({ 
      default: module.SystemStatusIndicator 
    }))
  );

  return (
    <React.Suspense fallback={
      <div className={`agent-control-panel-fallback ${className}`}>
        <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
          <div className={`w-2 h-2 rounded-full ${isAgentEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-sm font-mono text-slate-300">
            AI Agent {isAgentEnabled ? 'ACTIVE' : 'INACTIVE'}
          </span>
          <button
            onClick={toggleAgent}
            className={`px-3 py-1 text-xs font-bold rounded transition-all ${
              isAgentEnabled 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isAgentEnabled ? 'DISABLE' : 'ENABLE'}
          </button>
        </div>
      </div>
    }>
      <SystemStatusIndicator
        isAgentEnabled={isAgentEnabled}
        activeAgentCount={activeAgentCount}
        systemHealth={systemHealth}
        onToggleAgent={toggleAgent}
        className={className}
      />
    </React.Suspense>
  );
};

export default AgentEnabledWrapper;