// Station Agent Integration Component
// Provides seamless integration with existing EV charging station UI
// Adds agent functionality without modifying existing APIs or components

import React, { useEffect, useState, useCallback } from 'react';
import { AgentTerminalManager } from '../AgentTerminalManager.js';
import { AgentState, TelemetryData, FaultEvent } from '../types.js';
import { telemetrySimulator } from '../telemetrySimulator.js';
import { faultDetector } from '../faultDetector.js';
import { agentStateManager } from '../agentState.js';

export interface StationAgentIntegrationProps {
  // Station data from existing UI (Station interface from mockData)
  selectedStation?: {
    id: string;
    name: string;
    status: 'safe' | 'warning' | 'critical';
    temp: number;
    load: number;
    lat: number;
    lng: number;
  } | null;
  
  // Integration settings
  enabled?: boolean;
  autoActivateOnCritical?: boolean;
  monitoringInterval?: number;
  
  // Optional callbacks for existing UI integration
  onAgentStateChange?: (stationId: string, agentState: AgentState) => void;
  onFaultDetected?: (fault: FaultEvent) => void;
}

export const StationAgentIntegration: React.FC<StationAgentIntegrationProps> = ({
  selectedStation,
  enabled = true,
  autoActivateOnCritical = true,
  monitoringInterval = 2000,
  onAgentStateChange,
  onFaultDetected
}) => {
  const [agentStates, setAgentStates] = useState<Map<string, AgentState>>(new Map());
  const [activeStations, setActiveStations] = useState<Set<string>>(new Set());
  const [telemetryData, setTelemetryData] = useState<Map<string, TelemetryData>>(new Map());

  // Convert existing station data to agent telemetry format
  const convertStationToTelemetry = useCallback((station: NonNullable<typeof selectedStation>): TelemetryData => {
    return {
      stationId: station.id,
      timestamp: Date.now(),
      voltage: 220 + (Math.random() - 0.5) * 20, // 210-230V normal range
      current: (station.load / 100) * 32, // Convert load percentage to current
      temperature: station.temp,
      powerOutput: (station.load / 100) * 7.4, // Convert to kW
      connectionStatus: station.status === 'critical' ? 'error' : 'connected',
      chargingState: station.status === 'critical' ? 'fault' : 
                   station.load > 80 ? 'charging' : 
                   station.load > 0 ? 'charging' : 'idle'
    };
  }, []);

  // Initialize agent for a station
  const initializeStationAgent = useCallback((stationId: string) => {
    if (!enabled || activeStations.has(stationId)) return;

    // Initialize agent state
    const initialState: AgentState = {
      phase: 'STABLE',
      stationId,
      startTime: Date.now(),
      logs: [{
        timestamp: Date.now(),
        level: 'info',
        message: `Agent initialized for station ${stationId}`
      }]
    };

    setAgentStates(prev => new Map(prev).set(stationId, initialState));
    setActiveStations(prev => new Set(prev).add(stationId));

    // Start telemetry monitoring
    startTelemetryMonitoring(stationId);
  }, [enabled, activeStations]);

  // Start telemetry monitoring for a station
  const startTelemetryMonitoring = useCallback((stationId: string) => {
    const interval = setInterval(() => {
      if (!selectedStation || selectedStation.id !== stationId) {
        clearInterval(interval);
        return;
      }

      // Generate telemetry from existing station data
      const telemetry = convertStationToTelemetry(selectedStation);
      setTelemetryData(prev => new Map(prev).set(stationId, telemetry));

      // Run fault detection
      const fault = faultDetector.analyzeTelemetry(telemetry);
      
      if (fault) {
        handleFaultDetected(fault);
      } else {
        // Update agent state to stable if no faults
        updateAgentPhase(stationId, 'STABLE');
      }
    }, monitoringInterval);

    return () => clearInterval(interval);
  }, [selectedStation, convertStationToTelemetry, monitoringInterval]);

  // Handle fault detection
  const handleFaultDetected = useCallback(async (fault: FaultEvent) => {
    const stationId = fault.stationId;
    
    // Update agent state to critical
    updateAgentPhase(stationId, 'CRITICAL', fault);
    
    // Notify external handlers
    onFaultDetected?.(fault);

    // Start autonomous recovery process
    setTimeout(() => startDiagnosisPhase(stationId), 1000);
  }, [onFaultDetected]);

  // Update agent phase
  const updateAgentPhase = useCallback((
    stationId: string, 
    phase: AgentState['phase'], 
    fault?: FaultEvent
  ) => {
    setAgentStates(prev => {
      const current = prev.get(stationId);
      if (!current) return prev;

      const updated: AgentState = {
        ...current,
        phase,
        currentFault: fault || current.currentFault,
        logs: [
          ...current.logs,
          {
            timestamp: Date.now(),
            level: phase === 'CRITICAL' ? 'error' : 'info',
            message: `Phase transition: ${current.phase} → ${phase}`,
            data: fault ? { faultId: fault.id, faultType: fault.type } : undefined
          }
        ]
      };

      // Notify external handlers
      onAgentStateChange?.(stationId, updated);

      return new Map(prev).set(stationId, updated);
    });
  }, [onAgentStateChange]);

  // Start diagnosis phase
  const startDiagnosisPhase = useCallback(async (stationId: string) => {
    updateAgentPhase(stationId, 'DIAGNOSING');
    
    // Simulate diagnosis process
    setTimeout(() => {
      const agentState = agentStates.get(stationId);
      if (agentState?.currentFault) {
        // Create mock diagnosis result
        const diagnosis = {
          faultId: agentState.currentFault.id,
          rootCause: `${agentState.currentFault.type} detected in station systems`,
          confidence: 0.85,
          reasoning: [
            'Analyzing telemetry patterns',
            'Cross-referencing fault signatures',
            'Determining optimal recovery strategy'
          ],
          recommendedActions: ['Reset system parameters', 'Verify connections'],
          estimatedRecoveryTime: 3000
        };

        setAgentStates(prev => {
          const current = prev.get(stationId);
          if (!current) return prev;
          
          return new Map(prev).set(stationId, {
            ...current,
            diagnosis
          });
        });

        startExecutionPhase(stationId);
      }
    }, 2000);
  }, [agentStates]);

  // Start execution phase
  const startExecutionPhase = useCallback(async (stationId: string) => {
    updateAgentPhase(stationId, 'EXECUTING');
    
    // Simulate recovery execution
    setTimeout(() => {
      updateAgentPhase(stationId, 'RESOLVED');
      
      // Return to stable after resolution
      setTimeout(() => {
        updateAgentPhase(stationId, 'STABLE');
      }, 3000);
    }, 3000);
  }, []);

  // Deactivate agent for a station
  const deactivateStationAgent = useCallback((stationId: string) => {
    setActiveStations(prev => {
      const newSet = new Set(prev);
      newSet.delete(stationId);
      return newSet;
    });
    
    setAgentStates(prev => {
      const newMap = new Map(prev);
      newMap.delete(stationId);
      return newMap;
    });
    
    setTelemetryData(prev => {
      const newMap = new Map(prev);
      newMap.delete(stationId);
      return newMap;
    });
  }, []);

  // Handle station selection changes
  useEffect(() => {
    if (!enabled) return;

    if (selectedStation) {
      // Auto-activate agent if station is critical
      if (autoActivateOnCritical && selectedStation.status === 'critical') {
        initializeStationAgent(selectedStation.id);
      }
    }
  }, [selectedStation, enabled, autoActivateOnCritical, initializeStationAgent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up all active monitoring
      activeStations.forEach(stationId => {
        deactivateStationAgent(stationId);
      });
    };
  }, [activeStations, deactivateStationAgent]);

  // Don't render anything if disabled
  if (!enabled) {
    return null;
  }

  return (
    <AgentTerminalManager
      agentStates={agentStates}
      onTerminalClose={(stationId) => {
        // Keep agent active but close terminal
        // Agent continues monitoring in background
      }}
      maxConcurrentTerminals={3}
      autoOpenOnFault={true}
      terminalSpacing={20}
    />
  );
};

// Hook for easy integration with existing components
export const useStationAgent = (options: {
  enabled?: boolean;
  autoActivateOnCritical?: boolean;
  monitoringInterval?: number;
} = {}) => {
  const [agentStates, setAgentStates] = useState<Map<string, AgentState>>(new Map());
  const [isAgentActive, setIsAgentActive] = useState(false);

  const activateAgent = useCallback((stationId: string) => {
    setIsAgentActive(true);
    // Additional activation logic can be added here
  }, []);

  const deactivateAgent = useCallback((stationId: string) => {
    setIsAgentActive(false);
    setAgentStates(prev => {
      const newMap = new Map(prev);
      newMap.delete(stationId);
      return newMap;
    });
  }, []);

  const getAgentState = useCallback((stationId: string) => {
    return agentStates.get(stationId);
  }, [agentStates]);

  return {
    agentStates,
    isAgentActive,
    activateAgent,
    deactivateAgent,
    getAgentState,
    
    // Integration component
    AgentIntegration: (props: Omit<StationAgentIntegrationProps, keyof typeof options>) => (
      <StationAgentIntegration {...options} {...props} />
    )
  };
};

export default StationAgentIntegration;