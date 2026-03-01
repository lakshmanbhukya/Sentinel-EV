// System Intelligence Layer - Seamless integration with existing EV charging UI
// Maintains visual hierarchy and provides system-level intelligence interface

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GridRegulationTerminal } from './GridRegulationTerminal.js';
import { AgentState, TelemetryData, FaultEvent } from '../types.js';
import { agentController } from '../AgentController.js';
import { realTimeTelemetry } from '../realTimeTelemetry.js';

// Error Boundary Component
class AgentErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Agent Component Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#ef4444',
          fontFamily: 'monospace',
          fontSize: '12px',
          zIndex: 1100
        }}>
          ⚠️ AI Agent Error: {this.state.error?.message || 'Unknown error'}
        </div>
      );
    }

    return this.props.children;
  }
}

export interface SystemIntelligenceLayerProps {
  // Station data from existing UI
  selectedStation?: {
    id: string;
    name: string;
    status: 'safe' | 'warning' | 'critical';
    temp: number;
    load: number;
    lat: number;
    lng: number;
  } | null;
  
  // All stations for system-wide monitoring
  allStations?: {
    id: string;
    name: string;
    status: 'safe' | 'warning' | 'critical';
    temp: number;
    load: number;
    lat: number;
    lng: number;
  }[];
  
  // Integration settings
  enabled?: boolean;
  autoActivateOnCritical?: boolean;
  monitoringInterval?: number;
  maxConcurrentAgents?: number;
  
  // Event callbacks
  onSystemStateChange?: (systemState: SystemState) => void;
  onAgentActivated?: (stationId: string, agentState: AgentState) => void;
  onFaultDetected?: (fault: FaultEvent) => void;
  onStationStatusChange?: (stationId: string, newStatus: 'safe' | 'warning' | 'critical') => void;
  
  className?: string;
}

interface SystemState {
  totalAgents: number;
  activeAgents: number;
  criticalStations: string[];
  systemHealth: 'optimal' | 'monitoring' | 'responding' | 'critical';
  lastActivity: number;
}

export const SystemIntelligenceLayer: React.FC<SystemIntelligenceLayerProps> = ({
  selectedStation,
  allStations = [],
  enabled = true,
  autoActivateOnCritical = true,
  monitoringInterval = 2000,
  maxConcurrentAgents = 3,
  onSystemStateChange,
  onAgentActivated,
  onFaultDetected,
  onStationStatusChange,
  className = ''
}) => {
  const [agentStates, setAgentStates] = useState<Map<string, AgentState>>(new Map());
  const [systemState, setSystemState] = useState<SystemState>({
    totalAgents: 0,
    activeAgents: 0,
    criticalStations: [],
    systemHealth: 'optimal',
    lastActivity: Date.now()
  });
  const [monitoredStations, setMonitoredStations] = useState<Set<string>>(new Set());

  // Initialize agent controller when enabled (prevent duplicate initialization)
  const initializationRef = useRef<boolean>(false);
  
  useEffect(() => {
    if (!enabled) {
      if (initializationRef.current) {
        agentController.stop();
        initializationRef.current = false;
      }
      return;
    }

    if (initializationRef.current) {
      return; // Already initialized
    }

    const initializeController = async () => {
      console.log('🤖 Initializing Agent Controller System...');
      initializationRef.current = true;
      
      // Initialize the agent controller
      try {
        await agentController.initialize();
        agentController.start();
        
        // Set up event callbacks
        agentController.onAgentStateChange((stationId, state) => {
          setAgentStates(prev => new Map(prev).set(stationId, state));
          onAgentActivated?.(stationId, state);
        });

        agentController.onFaultDetected((fault) => {
          console.log(`🚨 Fault detected via controller: ${fault.description}`);
          onFaultDetected?.(fault);
        });

        agentController.onRecoveryComplete((stationId, result) => {
          console.log(`✅ Recovery completed for station ${stationId}: ${result.message}`);
        });

        console.log('✅ Agent Controller System initialized and started');
      } catch (error) {
        console.error('❌ Failed to initialize Agent Controller:', error);
        initializationRef.current = false;
      }
    };

    initializeController();

    // Cleanup function
    return () => {
      // Don't stop immediately, let it run for a bit
      setTimeout(() => {
        if (initializationRef.current && !enabled) {
          agentController.stop();
          initializationRef.current = false;
        }
      }, 5000); // 5 second delay before stopping
    };
  }, [enabled]); // Only depend on enabled flag

  // Auto-detect and heal all critical/warning stations when agent is enabled (prevent loops)
  const lastProcessedKey = useRef<string>('');
  const healedStations = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (!enabled || !autoActivateOnCritical || allStations.length === 0) return;

    // Use a ref to track if we've already processed these stations
    const stationStatusKey = allStations.map(s => `${s.id}:${s.status}`).sort().join(',');
    
    if (lastProcessedKey.current === stationStatusKey) {
      return; // Already processed this exact set of stations
    }
    
    lastProcessedKey.current = stationStatusKey;

    // Throttle this effect to prevent excessive activations
    const timeoutId = setTimeout(() => {
      // Find all stations that need healing (excluding already healed ones)
      const stationsNeedingHealing = allStations.filter(station => 
        (station.status === 'critical' || station.status === 'warning') &&
        !healedStations.current.has(station.id)
      );

      if (stationsNeedingHealing.length === 0) return;

      console.log(`🤖 AI Agent: Detected ${stationsNeedingHealing.length} stations needing healing:`, 
        stationsNeedingHealing.map(s => `${s.name} (${s.status})`));

      // Activate agents for all stations that need healing (with delay to prevent overwhelming)
      stationsNeedingHealing.forEach(async (station, index) => {
        setTimeout(async () => {
          console.log(`🔧 Activating agent for ${station.name} (${station.status})`);
          await agentController.activateAgent(station.id, station);
          
          // Mark as healed to prevent re-activation
          healedStations.current.add(station.id);
        }, index * 2000); // Increased stagger to 2 seconds
      });

      console.log(`🎯 AI Agent will heal all ${stationsNeedingHealing.length} stations and turn them green!`);
    }, 3000); // Increased delay to 3 seconds

    return () => clearTimeout(timeoutId);
  }, [enabled, autoActivateOnCritical]); // Removed allStations dependency to prevent loops

  // Monitor selected station
  useEffect(() => {
    if (!enabled || !selectedStation) return;

    // Auto-activate agent for critical stations
    if (autoActivateOnCritical && selectedStation.status === 'critical') {
      agentController.activateAgent(selectedStation.id, selectedStation);
    }
  }, [enabled, selectedStation, autoActivateOnCritical]);

  // Update system state (throttled)
  useEffect(() => {
    const updateSystemState = () => {
      // Get agent states from controller
      const controllerAgents = agentController.getActiveAgents();
      setAgentStates(controllerAgents);

      const agents = Array.from(controllerAgents.values());
      const activeAgents = agents.filter(agent => agent.phase !== 'STABLE');
      const criticalStations = agents
        .filter(agent => agent.phase === 'CRITICAL')
        .map(agent => agent.stationId);

      let systemHealth: SystemState['systemHealth'] = 'optimal';
      if (criticalStations.length > 0) {
        systemHealth = 'critical';
      } else if (activeAgents.length > 0) {
        systemHealth = 'responding';
      } else if (agents.length > 0) {
        systemHealth = 'monitoring';
      }

      const newSystemState: SystemState = {
        totalAgents: agents.length,
        activeAgents: activeAgents.length,
        criticalStations,
        systemHealth,
        lastActivity: Date.now()
      };

      setSystemState(newSystemState);
      onSystemStateChange?.(newSystemState);
    };

    // Initial update
    updateSystemState();

    // Set up throttled interval
    const interval = setInterval(updateSystemState, 5000); // Reduced to every 5 seconds

    return () => clearInterval(interval);
  }, [onSystemStateChange]); // Simplified dependencies

  // Handle agent close
  const handleAgentClose = useCallback((stationId: string) => {
    agentController.stopAgent(stationId);
  }, []);

  // Handle station status change and stop agent monitoring
  const handleStationStatusChange = useCallback((stationId: string, newStatus: 'safe' | 'warning' | 'critical') => {
    console.log(`🔄 Station ${stationId} status changed to ${newStatus}`);
    
    // Call the parent callback
    if (onStationStatusChange) {
      onStationStatusChange(stationId, newStatus);
    }
    
    // If station is now safe, stop the agent to prevent re-detection
    if (newStatus === 'safe') {
      console.log(`✅ Station ${stationId} is now safe - stopping agent monitoring`);
      setTimeout(() => {
        agentController.stopAgent(stationId);
      }, 3000); // Wait 3 seconds before stopping
    }
  }, [onStationStatusChange]);

  if (!enabled) return null;

  return (
    <div className={`system-intelligence-layer ${className}`}>
      {/* Grid Regulation Terminal - Bottom-center positioning with Error Boundary */}
      <AgentErrorBoundary>
        <GridRegulationTerminal
          isAgentEnabled={enabled}
          selectedStation={selectedStation}
          agentStates={agentStates}
          onStationStatusChange={handleStationStatusChange}
          onClose={() => selectedStation && handleAgentClose(selectedStation.id)}
        />
      </AgentErrorBoundary>

      {/* System Health Indicator - Minimal, non-intrusive */}
      <AnimatePresence>
        {systemState.activeAgents > 0 && (
          <motion.div
            className="system-health-indicator"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`health-pulse ${systemState.systemHealth}`} />
            <div className="health-text">
              <div className="health-status">NEURAL GRID</div>
              <div className="health-count">{systemState.activeAgents} ACTIVE</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .system-intelligence-layer {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 900;
        }

        /* System Health Indicator */
        .system-health-indicator {
          position: fixed;
          top: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 20px;
          padding: 8px 12px;
          backdrop-filter: blur(12px);
          pointer-events: auto;
          z-index: 1200;
        }

        .health-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .health-pulse.optimal {
          background: #10b981;
        }

        .health-pulse.monitoring {
          background: #06b6d4;
          animation: pulse-monitoring 2s ease-in-out infinite;
        }

        .health-pulse.responding {
          background: #f59e0b;
          animation: pulse-responding 1.5s ease-in-out infinite;
        }

        .health-pulse.critical {
          background: #ef4444;
          animation: pulse-critical 1s ease-in-out infinite;
        }

        @keyframes pulse-monitoring {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes pulse-responding {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }

        @keyframes pulse-critical {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }

        .health-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .health-status {
          font-family: 'Space Mono', 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          color: rgba(34, 211, 238, 0.9);
          letter-spacing: 0.5px;
          line-height: 1;
        }

        .health-count {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: rgba(148, 163, 184, 0.8);
          line-height: 1;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .system-health-indicator {
            top: 10px;
            right: 10px;
            padding: 6px 10px;
          }

          .health-status {
            font-size: 9px;
          }

          .health-count {
            font-size: 8px;
          }
        }

        @media (max-width: 480px) {
          .system-health-indicator {
            position: fixed;
            top: auto;
            bottom: 80px;
            right: 10px;
            left: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default SystemIntelligenceLayer;