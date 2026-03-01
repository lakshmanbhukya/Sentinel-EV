// Grid Regulation Terminal - Bottom-center AI agent for EV charging grid regulation
// Shows realistic data regulation and optimization when AI agent is enabled

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentState } from '../types.js';
import { Activity, Zap, TrendingUp, Shield, Brain, Settings, BarChart3, AlertTriangle, Lock } from 'lucide-react';
import { performanceMonitor, PerformanceMetrics, SystemHealth } from '../performanceMonitor.js';
import { predictiveAnalytics, PredictionResult } from '../predictiveAnalytics.js';
import { securityMonitor, SecurityMetrics, SecurityThreat } from '../securityMonitor.js';

// Throttling utility to prevent excessive updates
const createThrottledFunction = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  let lastCall = 0;
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      callback(...args);
    }
  }) as T;
};

export interface GridRegulationTerminalProps {
  isAgentEnabled: boolean;
  selectedStation?: {
    id: string;
    name: string;
    status: 'safe' | 'warning' | 'critical';
    temp: number;
    load: number;
  } | null;
  agentStates: Map<string, AgentState>;
  onStationStatusChange?: (stationId: string, newStatus: 'safe' | 'warning' | 'critical') => void;
  onClose?: () => void;
  className?: string;
}

interface RegulationMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  optimal: boolean;
  icon: React.ComponentType<any>;
}

interface RegulationAction {
  id: string;
  timestamp: number;
  action: string;
  station?: string;
  impact: string;
  type: 'optimization' | 'regulation' | 'balancing' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration?: number;
  status: 'executing' | 'completed' | 'failed';
}

interface SystemLog {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  module: string;
  message: string;
  details?: string;
}

interface StationRecovery {
  stationId: string;
  originalStatus: 'critical' | 'warning';
  targetStatus: 'safe';
  startTime: number;
  estimatedDuration: number;
  currentProgress: number;
  phase: 'identified' | 'analyzing' | 'diagnosing' | 'processing' | 'stabilizing' | 'stabilized' | 'completed';
  phaseDescription: string;
}

export const GridRegulationTerminal: React.FC<GridRegulationTerminalProps> = ({
  isAgentEnabled,
  selectedStation,
  agentStates,
  onStationStatusChange,
  onClose,
  className = ''
}) => {
  // Wrap the entire component in a try-catch for safety
  try {
    const [isExpanded, setIsExpanded] = useState(false);
  const [regulationMetrics, setRegulationMetrics] = useState<RegulationMetric[]>([]);
  const [recentActions, setRecentActions] = useState<RegulationAction[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [stationRecoveries, setStationRecoveries] = useState<Map<string, StationRecovery>>(new Map());
  const [isRegulating, setIsRegulating] = useState(false);
  const [gridEfficiency, setGridEfficiency] = useState(87.3);
  const [activeTab, setActiveTab] = useState<'metrics' | 'actions' | 'logs' | 'recovery' | 'performance' | 'predictions' | 'security'>('metrics');
  
  // New monitoring system states
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [securityThreats, setSecurityThreats] = useState<SecurityThreat[]>([]);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const recoveryIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const actionsRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef<HTMLDivElement>(null);

  // Memoized values to prevent unnecessary re-renders
  const activeAgentsCount = useMemo(() => {
    return Array.from(agentStates.values()).filter(state => state.phase !== 'STABLE').length;
  }, [agentStates]);

  const isSystemRegulating = useMemo(() => {
    return activeAgentsCount > 0;
  }, [activeAgentsCount]);

  // Add system log (non-throttled for critical logs)
  const addSystemLog = useCallback((level: SystemLog['level'], module: string, message: string, details?: string) => {
    const newLog: SystemLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      level,
      module,
      message,
      details
    };
    
    console.log(`[${level}] [${module}] ${message}`, details || '');
    setSystemLogs(prev => [newLog, ...prev.slice(0, 99)]); // Keep last 100 logs
  }, []);

  // Start station recovery process
  const startStationRecovery = useCallback((stationId: string, currentStatus: 'critical' | 'warning') => {
    const estimatedDuration = currentStatus === 'critical' ? 35000 : 25000; // 35s for critical, 25s for warning
    
    const recovery: StationRecovery = {
      stationId,
      originalStatus: currentStatus,
      targetStatus: 'safe',
      startTime: Date.now(),
      estimatedDuration,
      currentProgress: 0,
      phase: 'identified',
      phaseDescription: 'Fault identified - Initiating recovery protocol'
    };
    
    setStationRecoveries(prev => new Map(prev).set(stationId, recovery));
    
    addSystemLog('INFO', 'RECOVERY', `🔧 Starting recovery for station ${stationId}`, 
      `Status: ${currentStatus} → safe, Duration: ${Math.round(estimatedDuration/1000)}s`);
    
    // Add recovery action
    const recoveryAction: RegulationAction = {
      id: `recovery-${stationId}-${Date.now()}`,
      timestamp: Date.now(),
      action: `Emergency recovery initiated for station ${stationId}`,
      station: stationId,
      impact: `Restoring to operational status`,
      type: 'emergency',
      severity: currentStatus === 'critical' ? 'critical' : 'high',
      duration: estimatedDuration,
      status: 'executing'
    };
    
    setRecentActions(prev => [recoveryAction, ...prev.slice(0, 19)]);
    
    console.log(`🔧 Recovery started for station ${stationId}:`, recovery);
  }, [addSystemLog]);

  // Initialize realistic data when agent is enabled
  useEffect(() => {
    if (!isAgentEnabled) return;

    // Initialize system logs
    addSystemLog('SUCCESS', 'SYSTEM', 'Grid Regulation AI System activated');
    addSystemLog('INFO', 'TELEMETRY', 'Real-time monitoring initiated across all stations');
    addSystemLog('INFO', 'ML_ENGINE', 'Predictive algorithms loaded and calibrated');
    addSystemLog('INFO', 'LOAD_BALANCER', 'Dynamic load balancing protocols active');
    addSystemLog('INFO', 'FAULT_DETECTOR', 'Fault detection thresholds configured');
    addSystemLog('INFO', 'RECOVERY_ENGINE', 'Recovery action library loaded');
    addSystemLog('INFO', 'PERFORMANCE', 'Performance monitoring system online');
    addSystemLog('INFO', 'SECURITY', 'Security monitoring protocols activated');
    addSystemLog('INFO', 'PREDICTIVE', 'ML prediction models initialized');

    // Start monitoring systems with reduced frequency
    performanceMonitor.startMonitoring(10000); // Increased to 10 seconds
    securityMonitor.startMonitoring();

    // Set up performance monitoring callback with throttling
    const throttledHealthUpdate = createThrottledFunction((health: SystemHealth) => {
      setSystemHealth(health);
      setPerformanceMetrics(health.metrics);
      
      if (health.alerts.length > 0) {
        health.alerts.forEach(alert => {
          addSystemLog('WARN', 'PERFORMANCE', alert);
        });
      }
    }, 5000); // Throttle to every 5 seconds

    performanceMonitor.onHealthUpdate(throttledHealthUpdate);

    // Set up security monitoring callback with throttling
    const throttledThreatUpdate = createThrottledFunction((threat: SecurityThreat) => {
      setSecurityThreats(prev => {
        // Check if threat already exists
        const exists = prev.some(t => t.id === threat.id);
        if (exists) return prev;
        
        return [threat, ...prev.slice(0, 9)]; // Keep last 10 threats
      });
      addSystemLog(
        threat.severity === 'critical' ? 'ERROR' : 'WARN',
        'SECURITY',
        threat.description,
        `Source: ${threat.source}, Type: ${threat.type}`
      );
    }, 3000); // Throttle to every 3 seconds

    securityMonitor.onThreatDetected(throttledThreatUpdate);

    const initialMetrics: RegulationMetric[] = [
      {
        id: 'load_balance',
        label: 'Load Distribution',
        value: 94.2,
        unit: '%',
        trend: 'stable',
        optimal: true,
        icon: Activity
      },
      {
        id: 'power_efficiency',
        label: 'Energy Efficiency',
        value: 91.7,
        unit: '%',
        trend: 'up',
        optimal: true,
        icon: Zap
      },
      {
        id: 'grid_stability',
        label: 'Grid Stability',
        value: 98.1,
        unit: '%',
        trend: 'stable',
        optimal: true,
        icon: Shield
      },
      {
        id: 'demand_prediction',
        label: 'ML Prediction Accuracy',
        value: 89.4,
        unit: '%',
        trend: 'up',
        optimal: true,
        icon: Brain
      }
    ];

    setRegulationMetrics(initialMetrics);

    // Add initial system status log
    const totalStations = Array.from(agentStates.keys()).length;
    const criticalStations = Array.from(agentStates.values()).filter(s => s.phase === 'CRITICAL').length;
    addSystemLog('INFO', 'SYSTEM', `Monitoring ${totalStations} stations, ${criticalStations} require intervention`);

    // Generate initial predictions for selected station (only once)
    if (selectedStation) {
      predictiveAnalytics.generatePredictions(selectedStation.id).then(predictions => {
        setPredictions(predictions);
        if (predictions.length > 0) {
          addSystemLog('INFO', 'PREDICTIVE', `Generated ${predictions.length} predictions for station ${selectedStation.id}`);
        }
      }).catch(console.error);
    }

    // CRITICAL FIX: Add initial mock recovery for demo purposes
    // This ensures the Recovery tab always has visible content
    setTimeout(() => {
      if (selectedStation && (selectedStation.status === 'critical' || selectedStation.status === 'warning')) {
        console.log(`🔧 Creating initial mock recovery for station ${selectedStation.id} (${selectedStation.status})`);
        startStationRecovery(selectedStation.id, selectedStation.status);
      }
    }, 2000); // Start after 2 seconds

    // Cleanup function
    return () => {
      performanceMonitor.stopMonitoring();
    };
  }, [isAgentEnabled]); // Simplified dependencies

  // Monitor agent states and auto-start recovery for critical/warning stations
  useEffect(() => {
    if (!isAgentEnabled || agentStates.size === 0) return;

    console.log(`🔍 Checking ${agentStates.size} agent states for recovery needs...`);

    // Check each agent state
    for (const [stationId, agentState] of agentStates) {
      console.log(`📊 Station ${stationId}: phase=${agentState.phase}, hasRecovery=${stationRecoveries.has(stationId)}`);
      
      // Only start recovery if not already recovering AND phase is CRITICAL
      if (!stationRecoveries.has(stationId) && agentState.phase === 'CRITICAL') {
        if (agentState.currentFault) {
          const stationStatus = agentState.currentFault.severity === 'critical' ? 'critical' : 'warning';
          console.log(`🚨 Auto-starting recovery for station ${stationId} (${stationStatus})`);
          startStationRecovery(stationId, stationStatus);
        } else {
          // No fault info, but phase is CRITICAL - use default
          console.log(`🚨 Auto-starting recovery for station ${stationId} (defaulting to critical)`);
          startStationRecovery(stationId, 'critical');
        }
      }
    }
  }, [isAgentEnabled, agentStates.size, startStationRecovery]); // Only trigger on size change

  // Simulate real-time regulation when agent is active
  useEffect(() => {
    if (!isAgentEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      return;
    }

    // Check if any agents are actively working
    setIsRegulating(isSystemRegulating);

    // Auto-start recovery for critical/warning stations (only once per station)
    for (const [stationId, agentState] of agentStates) {
      if (agentState.phase === 'CRITICAL' && agentState.currentFault && !stationRecoveries.has(stationId)) {
        const stationStatus = agentState.currentFault.severity === 'critical' ? 'critical' : 'warning';
        startStationRecovery(stationId, stationStatus);
      }
    }

    // Clear existing interval to prevent multiple intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Start regulation simulation with reduced frequency
    intervalRef.current = setInterval(() => {
      // Update metrics with realistic fluctuations (less frequent)
      if (Math.random() > 0.5) { // Only update 50% of the time
        setRegulationMetrics(prev => prev.map(metric => {
          const variance = (Math.random() - 0.5) * 1.0; // Reduced variance
          const newValue = Math.max(0, Math.min(100, metric.value + variance));
          
          return {
            ...metric,
            value: parseFloat(newValue.toFixed(1)),
            trend: variance > 0.3 ? 'up' : variance < -0.3 ? 'down' : 'stable',
            optimal: newValue > 85
          };
        }));
      }

      // Update grid efficiency less frequently
      if (Math.random() > 0.7) {
        setGridEfficiency(prev => {
          const change = (Math.random() - 0.5) * 0.8; // Reduced change
          return parseFloat(Math.max(75, Math.min(99, prev + change)).toFixed(1));
        });
      }

      // Update security metrics less frequently
      if (Math.random() > 0.8) {
        const currentSecurityMetrics = securityMonitor.getCurrentSecurityMetrics();
        setSecurityMetrics(currentSecurityMetrics);
      }

      // Update predictions much less frequently
      if (selectedStation && Math.random() > 0.95) { // Very rare updates
        predictiveAnalytics.generatePredictions(selectedStation.id).then(newPredictions => {
          setPredictions(newPredictions);
        }).catch(console.error);
      }

      // Add realistic regulation actions less frequently
      if (isSystemRegulating && Math.random() > 0.8) { // Reduced frequency
        const activeAgents = Array.from(agentStates.values()).filter(state => state.phase !== 'STABLE');
        const realisticActions = [
          { action: 'Dynamic load redistribution across sector 7-A', impact: '+1.8% grid efficiency', type: 'optimization' as const, severity: 'medium' as const },
          { action: 'Voltage regulation adjustment for optimal charging', impact: '+2.1% power quality', type: 'regulation' as const, severity: 'low' as const },
          { action: 'Predictive scaling based on demand forecast', impact: '+3.2% capacity utilization', type: 'optimization' as const, severity: 'medium' as const },
          { action: 'Emergency load shedding protocol activated', impact: 'Grid stability maintained', type: 'emergency' as const, severity: 'critical' as const },
          { action: 'Renewable energy integration optimization', impact: '+1.5% clean energy usage', type: 'balancing' as const, severity: 'low' as const },
          { action: 'Thermal management system calibration', impact: 'Temperature normalized', type: 'regulation' as const, severity: 'medium' as const },
          { action: 'High-load balancer redistribution', impact: 'System stabilized', type: 'optimization' as const, severity: 'high' as const }
        ];

        const selectedAction = realisticActions[Math.floor(Math.random() * realisticActions.length)];
        const stationId = activeAgents.length > 0 ? 
          activeAgents[Math.floor(Math.random() * activeAgents.length)]?.stationId : 
          undefined;
        
        const newAction: RegulationAction = {
          id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          timestamp: Date.now(),
          action: selectedAction.action,
          station: stationId,
          impact: selectedAction.impact,
          type: selectedAction.type,
          severity: selectedAction.severity,
          duration: Math.floor(Math.random() * 10000) + 8000, // 8-18 seconds
          status: 'executing'
        };

        setRecentActions(prev => [newAction, ...prev.slice(0, 14)]); // Keep fewer actions
        
        // Add corresponding system log
        addSystemLog(
          selectedAction.severity === 'critical' ? 'ERROR' : 
          selectedAction.severity === 'high' ? 'WARN' : 'INFO',
          selectedAction.type.toUpperCase(),
          selectedAction.action,
          `Impact: ${selectedAction.impact}`
        );

        // Mark action as completed after duration
        setTimeout(() => {
          setRecentActions(prev => 
            prev.map(action => 
              action.id === newAction.id ? { ...action, status: 'completed' } : action
            )
          );
        }, newAction.duration);
      }
    }, 8000); // Increased interval to 8 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [isAgentEnabled]); // Removed problematic dependencies

  // Station recovery monitoring (more frequent updates for visibility)
  useEffect(() => {
    if (!isAgentEnabled || stationRecoveries.size === 0) {
      if (recoveryIntervalRef.current) {
        clearInterval(recoveryIntervalRef.current);
        recoveryIntervalRef.current = undefined;
      }
      return;
    }

    // Clear existing interval
    if (recoveryIntervalRef.current) {
      clearInterval(recoveryIntervalRef.current);
    }

    console.log(`📊 Monitoring ${stationRecoveries.size} station recoveries`);

    recoveryIntervalRef.current = setInterval(() => {
      setStationRecoveries(prev => {
        const updated = new Map(prev);
        let hasChanges = false;

        for (const [stationId, recovery] of updated) {
          const elapsed = Date.now() - recovery.startTime;
          const progress = Math.min(100, (elapsed / recovery.estimatedDuration) * 100);
          
          // Determine phase based on progress with detailed descriptions
          let newPhase = recovery.phase;
          let phaseDescription = recovery.phaseDescription;
          
          if (progress >= 100) {
            newPhase = 'completed';
            phaseDescription = 'Recovery completed - Station operational';
          } else if (progress > 85) {
            newPhase = 'stabilized';
            phaseDescription = 'System stabilized - Verifying operational status';
          } else if (progress > 70) {
            newPhase = 'stabilizing';
            phaseDescription = 'Stabilizing systems - Normalizing parameters';
          } else if (progress > 50) {
            newPhase = 'processing';
            phaseDescription = 'Processing recovery actions - Applying fixes';
          } else if (progress > 30) {
            newPhase = 'diagnosing';
            phaseDescription = 'Diagnosing root cause - Analyzing telemetry';
          } else if (progress > 10) {
            newPhase = 'analyzing';
            phaseDescription = 'Analyzing fault patterns - Determining strategy';
          } else {
            newPhase = 'identified';
            phaseDescription = 'Fault identified - Initiating recovery protocol';
          }
          
          // Always update if progress changed by more than 0.5% or phase changed
          if (Math.abs(progress - recovery.currentProgress) > 0.5 || newPhase !== recovery.phase) {
            updated.set(stationId, {
              ...recovery,
              currentProgress: progress,
              phase: newPhase,
              phaseDescription
            });
            hasChanges = true;

            console.log(`📈 Station ${stationId} recovery: ${progress.toFixed(1)}% (${newPhase})`);

            // Update station status when recovery completes
            if (progress >= 100 && recovery.phase !== 'completed') {
              console.log(`✅ Station ${stationId} recovery COMPLETED! Changing status to SAFE`);
              
              // Use setTimeout to avoid setState during render
              setTimeout(() => {
                if (onStationStatusChange) {
                  onStationStatusChange(stationId, 'safe');
                  console.log(`✅ Status change callback executed for station ${stationId}`);
                } else {
                  console.warn(`⚠️ No onStationStatusChange callback provided!`);
                }
              }, 0);
              
              addSystemLog('SUCCESS', 'RECOVERY', `✅ Station ${stationId} fully recovered and marked as SAFE!`, 
                `Status changed: ${recovery.originalStatus} → safe`);
              
              // Mark recovery action as completed
              setRecentActions(prevActions => 
                prevActions.map(action => 
                  action.station === stationId && action.status === 'executing'
                    ? { ...action, status: 'completed' }
                    : action
                )
              );
              
              // Remove from recovery tracking after a delay
              setTimeout(() => {
                setStationRecoveries(prev => {
                  const newMap = new Map(prev);
                  if (newMap.has(stationId)) {
                    newMap.delete(stationId);
                    console.log(`🗑️ Removed station ${stationId} from recovery tracking`);
                  }
                  return newMap;
                });
              }, 3000);
            }
          }
        }

        return hasChanges ? updated : prev;
      });
    }, 500); // Update every 500ms for smooth progress

    return () => {
      if (recoveryIntervalRef.current) {
        clearInterval(recoveryIntervalRef.current);
        recoveryIntervalRef.current = undefined;
      }
    };
  }, [isAgentEnabled, stationRecoveries.size, onStationStatusChange, addSystemLog]);

  // Auto-scroll actions (throttled)
  useEffect(() => {
    if (actionsRef.current && recentActions.length > 0) {
      // Throttle scroll updates
      const timeoutId = setTimeout(() => {
        if (actionsRef.current) {
          actionsRef.current.scrollTop = 0;
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [recentActions.length]); // Only trigger on length change

  if (!isAgentEnabled) return null;

  const getActionTypeColor = (type: RegulationAction['type']) => {
    switch (type) {
      case 'emergency': return 'text-red-400 bg-red-900/20 border-red-700/30';
      case 'optimization': return 'text-blue-400 bg-blue-900/20 border-blue-700/30';
      case 'regulation': return 'text-amber-400 bg-amber-900/20 border-amber-700/30';
      case 'balancing': return 'text-green-400 bg-green-900/20 border-green-700/30';
      default: return 'text-slate-400 bg-slate-900/20 border-slate-700/30';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      case 'stable': return '→';
    }
  };

  return (
    <div className={`grid-regulation-terminal ${className}`}>
      <motion.div
        className="terminal-container"
        initial={{ y: 100, opacity: 0 }}
        animate={{ 
          y: 0, 
          opacity: 1,
          height: isExpanded ? 400 : 80
        }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header - Always Visible */}
        <div 
          className="terminal-header"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="header-left">
            <div className="system-indicator">
              <div className={`status-pulse ${isRegulating ? 'active' : 'idle'}`} />
              <span className="system-label">GRID REGULATION AI</span>
            </div>
            <div className="efficiency-display">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="efficiency-value">{gridEfficiency}%</span>
              <span className="efficiency-label">EFFICIENCY</span>
            </div>
          </div>
          
          <div className="header-right">
            <div className="active-agents">
              {activeAgentsCount} ACTIVE
            </div>
            <button className="expand-button">
              {isExpanded ? '▼' : '▲'}
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="terminal-content"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Tabbed Content */}
              <div className="tabbed-content">
                <div className="tab-header">
                  <button 
                    className={`tab-button ${activeTab === 'metrics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('metrics')}
                  >
                    <Settings className="w-3 h-3" />
                    Metrics
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'recovery' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recovery')}
                  >
                    <Activity className="w-3 h-3" />
                    Recovery ({stationRecoveries.size})
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('performance')}
                  >
                    <BarChart3 className="w-3 h-3" />
                    Performance
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'predictions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('predictions')}
                  >
                    <Brain className="w-3 h-3" />
                    Predictions ({predictions.length})
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                  >
                    <Lock className="w-3 h-3" />
                    Security
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'actions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('actions')}
                  >
                    <Zap className="w-3 h-3" />
                    Actions ({recentActions.length})
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('logs')}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Logs ({systemLogs.length})
                  </button>
                </div>

                {/* Metrics Tab */}
                {activeTab === 'metrics' && (
                  <div className="tab-content">
                    <div className="metrics-grid">
                      {regulationMetrics.map(metric => {
                        const IconComponent = metric.icon;
                        return (
                          <div key={metric.id} className="metric-card">
                            <div className="metric-header">
                              <IconComponent className="w-4 h-4 text-slate-400" />
                              <span className="metric-label">{metric.label}</span>
                              <span className="metric-trend">{getTrendIcon(metric.trend)}</span>
                            </div>
                            <div className="metric-value">
                              <span className={`value ${metric.optimal ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {metric.value}
                              </span>
                              <span className="unit">{metric.unit}</span>
                            </div>
                            <div className="metric-progress">
                              <div className="progress-track">
                                <div 
                                  className={`progress-bar ${metric.optimal ? 'optimal' : 'warning'}`}
                                  style={{ width: `${metric.value}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Real-time System Status */}
                    <div className="system-status-section">
                      <div className="status-header">
                        <span className="status-label">System Status</span>
                        <div className="status-indicators">
                          <div className="indicator">
                            <div className="indicator-dot active" />
                            <span>Fault Detection</span>
                          </div>
                          <div className="indicator">
                            <div className="indicator-dot active" />
                            <span>Recovery Engine</span>
                          </div>
                          <div className="indicator">
                            <div className="indicator-dot active" />
                            <span>ML Prediction</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recovery Tab */}
                {activeTab === 'recovery' && (
                  <div className="tab-content">
                    {stationRecoveries.size === 0 ? (
                      <div className="no-content">
                        <span>No active station recoveries</span>
                      </div>
                    ) : (
                      <div className="recovery-list">
                        {Array.from(stationRecoveries.values()).map(recovery => (
                          <div key={recovery.stationId} className="recovery-item">
                            <div className="recovery-header">
                              <div className="recovery-station">
                                <span className="station-id">Station {recovery.stationId}</span>
                                <span className={`recovery-phase ${recovery.phase}`}>
                                  {recovery.phase.toUpperCase()}
                                </span>
                              </div>
                              <div className="recovery-timer">
                                {Math.max(0, Math.round((recovery.estimatedDuration - (Date.now() - recovery.startTime)) / 1000))}s
                              </div>
                            </div>
                            <div className="recovery-description">
                              {recovery.phaseDescription}
                            </div>
                            <div className="recovery-progress">
                              <div className="progress-bar">
                                <div 
                                  className="progress-fill"
                                  style={{ width: `${recovery.currentProgress}%` }}
                                />
                              </div>
                              <span className="progress-text">
                                {recovery.currentProgress.toFixed(1)}%
                              </span>
                            </div>
                            <div className="recovery-status">
                              <span className={`status-badge ${recovery.originalStatus}`}>
                                {recovery.originalStatus.toUpperCase()}
                              </span>
                              <span className="arrow">→</span>
                              <span className="status-badge safe">SAFE</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Performance Tab */}
                {activeTab === 'performance' && (
                  <div className="tab-content">
                    {!performanceMetrics || !systemHealth ? (
                      <div className="no-content">
                        <span>Loading performance data...</span>
                      </div>
                    ) : (
                      <div className="performance-content">
                        {/* System Health Overview */}
                        <div className="health-overview">
                          <div className="health-header">
                            <span className="health-label">System Health</span>
                            <span className={`health-status ${systemHealth.overall}`}>
                              {systemHealth.overall.toUpperCase()}
                            </span>
                          </div>
                          <div className="health-metrics">
                            <div className="health-metric">
                              <span className="metric-name">CPU Usage</span>
                              <div className="metric-bar">
                                <div 
                                  className={`metric-fill ${performanceMetrics.cpuUsage > 80 ? 'critical' : performanceMetrics.cpuUsage > 60 ? 'warning' : 'normal'}`}
                                  style={{ width: `${performanceMetrics.cpuUsage}%` }}
                                />
                              </div>
                              <span className="metric-value">{performanceMetrics.cpuUsage.toFixed(1)}%</span>
                            </div>
                            <div className="health-metric">
                              <span className="metric-name">Memory</span>
                              <div className="metric-bar">
                                <div 
                                  className={`metric-fill ${performanceMetrics.memoryUsage > 85 ? 'critical' : performanceMetrics.memoryUsage > 70 ? 'warning' : 'normal'}`}
                                  style={{ width: `${performanceMetrics.memoryUsage}%` }}
                                />
                              </div>
                              <span className="metric-value">{performanceMetrics.memoryUsage.toFixed(1)}%</span>
                            </div>
                            <div className="health-metric">
                              <span className="metric-name">Response Time</span>
                              <div className="metric-bar">
                                <div 
                                  className={`metric-fill ${performanceMetrics.responseTime > 200 ? 'critical' : performanceMetrics.responseTime > 100 ? 'warning' : 'normal'}`}
                                  style={{ width: `${Math.min(100, performanceMetrics.responseTime / 3)}%` }}
                                />
                              </div>
                              <span className="metric-value">{performanceMetrics.responseTime.toFixed(0)}ms</span>
                            </div>
                          </div>
                        </div>

                        {/* Performance Recommendations */}
                        {systemHealth.recommendations.length > 0 && (
                          <div className="recommendations-section">
                            <div className="section-title">Recommendations</div>
                            <div className="recommendations-list">
                              {systemHealth.recommendations.slice(0, 3).map((rec, index) => (
                                <div key={index} className="recommendation-item">
                                  <span className="rec-bullet">•</span>
                                  <span className="rec-text">{rec}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Performance Alerts */}
                        {systemHealth.alerts.length > 0 && (
                          <div className="alerts-section">
                            <div className="section-title">Active Alerts</div>
                            <div className="alerts-list">
                              {systemHealth.alerts.map((alert, index) => (
                                <div key={index} className="alert-item">
                                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                                  <span className="alert-text">{alert}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Predictions Tab */}
                {activeTab === 'predictions' && (
                  <div className="tab-content">
                    {predictions.length === 0 ? (
                      <div className="no-content">
                        <span>No predictions available</span>
                      </div>
                    ) : (
                      <div className="predictions-list">
                        {predictions.slice(0, 5).map(prediction => (
                          <div key={`${prediction.type}-${prediction.timeframe}`} className="prediction-item">
                            <div className="prediction-header">
                              <div className="prediction-type">
                                <span className={`type-badge ${prediction.type}`}>
                                  {prediction.type.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className={`severity-badge ${prediction.severity}`}>
                                  {prediction.severity.toUpperCase()}
                                </span>
                              </div>
                              <div className="prediction-confidence">
                                {(prediction.confidence * 100).toFixed(0)}% confidence
                              </div>
                            </div>
                            <div className="prediction-description">
                              {prediction.description}
                            </div>
                            <div className="prediction-timeframe">
                              Expected in: {Math.round(prediction.timeframe / 60000)} minutes
                            </div>
                            {prediction.recommendations.length > 0 && (
                              <div className="prediction-recommendations">
                                <div className="rec-title">Recommendations:</div>
                                {prediction.recommendations.slice(0, 2).map((rec, index) => (
                                  <div key={index} className="rec-item">• {rec}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="tab-content">
                    {!securityMetrics ? (
                      <div className="no-content">
                        <span>Loading security data...</span>
                      </div>
                    ) : (
                      <div className="security-content">
                        {/* Security Status Overview */}
                        <div className="security-overview">
                          <div className="security-header">
                            <span className="security-label">Security Status</span>
                            <div className={`threat-level ${securityMetrics.threatLevel}`}>
                              <div className="threat-indicator" />
                              <span className="threat-text">{securityMetrics.threatLevel.toUpperCase()}</span>
                            </div>
                          </div>
                          <div className="security-stats">
                            <div className="security-stat">
                              <span className="stat-label">Active Threats</span>
                              <span className="stat-value">{securityMetrics.activeThreats}</span>
                            </div>
                            <div className="security-stat">
                              <span className="stat-label">Blocked Attempts</span>
                              <span className="stat-value">{securityMetrics.blockedAttempts}</span>
                            </div>
                            <div className="security-stat">
                              <span className="stat-label">System Integrity</span>
                              <span className="stat-value">{securityMetrics.systemIntegrity}%</span>
                            </div>
                            <div className="security-stat">
                              <span className="stat-label">Encryption</span>
                              <span className={`stat-value ${securityMetrics.encryptionStatus}`}>
                                {securityMetrics.encryptionStatus.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Recent Security Threats */}
                        {securityThreats.length > 0 && (
                          <div className="threats-section">
                            <div className="section-title">Recent Threats</div>
                            <div className="threats-list">
                              {securityThreats.slice(0, 3).map(threat => (
                                <div key={threat.id} className="threat-item">
                                  <div className="threat-header">
                                    <span className={`threat-type ${threat.type}`}>
                                      {threat.type.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <span className={`threat-severity ${threat.severity}`}>
                                      {threat.severity.toUpperCase()}
                                    </span>
                                    <span className="threat-time">
                                      {new Date(threat.timestamp).toLocaleTimeString('en-US', {
                                        hour12: false,
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  <div className="threat-description">{threat.description}</div>
                                  <div className="threat-source">Source: {threat.source}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions Tab */}
                {activeTab === 'actions' && (
                  <div className="tab-content">
                    <div className="actions-list" ref={actionsRef}>
                      {recentActions.length === 0 ? (
                        <div className="no-content">
                          <span>Monitoring grid stability...</span>
                        </div>
                      ) : (
                        recentActions.map(action => (
                          <motion.div
                            key={action.id}
                            className="action-item"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="action-time">
                              {new Date(action.timestamp).toLocaleTimeString('en-US', {
                                hour12: false,
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </div>
                            <div className="action-content">
                              <div className="action-text">{action.action}</div>
                              {action.station && (
                                <div className="action-station">Station: {action.station}</div>
                              )}
                              <div className="action-meta">
                                <div className={`action-impact ${getActionTypeColor(action.type)}`}>
                                  {action.impact}
                                </div>
                                <div className={`action-status ${action.status}`}>
                                  {action.status.toUpperCase()}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Logs Tab */}
                {activeTab === 'logs' && (
                  <div className="tab-content">
                    <div className="logs-list" ref={logsRef}>
                      {systemLogs.length === 0 ? (
                        <div className="no-content">
                          <span>No system logs available</span>
                        </div>
                      ) : (
                        systemLogs.map(log => (
                          <div key={log.id} className="log-item">
                            <div className="log-time">
                              {new Date(log.timestamp).toLocaleTimeString('en-US', {
                                hour12: false,
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </div>
                            <div className="log-content">
                              <div className="log-header">
                                <span className={`log-level ${log.level.toLowerCase()}`}>
                                  {log.level}
                                </span>
                                <span className="log-module">[{log.module}]</span>
                              </div>
                              <div className="log-message">{log.message}</div>
                              {log.details && (
                                <div className="log-details">{log.details}</div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        .grid-regulation-terminal {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1100;
          pointer-events: auto;
          width: 600px;
          max-width: calc(100vw - 40px);
        }

        .terminal-container {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 12px;
          backdrop-filter: blur(16px);
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          will-change: height;
          transition: height 0.3s ease-in-out;
        }

        .terminal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          cursor: pointer;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
          transition: background-color 0.2s ease;
        }

        .terminal-header:hover {
          background: rgba(148, 163, 184, 0.05);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .system-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
        }

        .status-pulse.active {
          background: #06b6d4;
          animation: pulse-regulation 1.5s ease-in-out infinite;
        }

        .status-pulse.idle {
          background: #10b981;
          animation: pulse-gentle 3s ease-in-out infinite;
        }

        @keyframes pulse-regulation {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }

        @keyframes pulse-gentle {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        .system-label {
          font-family: 'Space Mono', 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          color: rgba(34, 211, 238, 0.9);
          letter-spacing: 0.5px;
        }

        .efficiency-display {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.1);
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .efficiency-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          font-weight: 600;
          color: #10b981;
        }

        .efficiency-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: rgba(16, 185, 129, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .active-agents {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(148, 163, 184, 0.8);
          background: rgba(148, 163, 184, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
        }

        .expand-button {
          background: none;
          border: none;
          color: rgba(148, 163, 184, 0.8);
          font-size: 12px;
          cursor: pointer;
          padding: 4px;
          transition: color 0.2s ease;
        }

        .expand-button:hover {
          color: rgba(226, 232, 240, 0.9);
        }

        .terminal-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: rgba(226, 232, 240, 0.9);
          font-weight: 500;
        }

        .processing-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
          font-size: 10px;
          color: rgba(6, 182, 212, 0.9);
        }

        .processing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #06b6d4;
          animation: pulse-processing 1s ease-in-out infinite;
        }

        @keyframes pulse-processing {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .metric-card {
          background: rgba(148, 163, 184, 0.05);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 8px;
          padding: 12px;
        }

        .metric-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }

        .metric-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(148, 163, 184, 0.8);
          flex: 1;
        }

        .metric-trend {
          font-size: 12px;
          color: rgba(148, 163, 184, 0.6);
        }

        .metric-value {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .metric-value .value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 18px;
          font-weight: 600;
        }

        .metric-value .unit {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: rgba(148, 163, 184, 0.6);
        }

        .metric-progress {
          margin-top: 8px;
        }

        .progress-track {
          width: 100%;
          height: 4px;
          background: rgba(148, 163, 184, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease;
        }

        .progress-bar.optimal {
          background: linear-gradient(90deg, #10b981, #34d399);
        }

        .progress-bar.warning {
          background: linear-gradient(90deg, #f59e0b, #fbbf24);
        }

        /* System Status Section */
        .system-status-section {
          margin-top: 16px;
          padding: 12px;
          background: rgba(148, 163, 184, 0.03);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 8px;
        }

        .status-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .status-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(148, 163, 184, 0.8);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-indicators {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(148, 163, 184, 0.7);
        }

        .indicator-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(148, 163, 184, 0.3);
        }

        .indicator-dot.active {
          background: #10b981;
          animation: pulse-gentle 2s ease-in-out infinite;
        }

        .actions-list {
          max-height: 150px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.2) transparent;
        }

        .actions-list::-webkit-scrollbar {
          width: 4px;
        }

        .actions-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .actions-list::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 2px;
        }

        .no-actions {
          text-align: center;
          padding: 20px;
          color: rgba(148, 163, 184, 0.6);
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
        }

        .action-item {
          display: flex;
          gap: 12px;
          padding: 8px;
          background: rgba(148, 163, 184, 0.03);
          border-radius: 6px;
          border-left: 3px solid rgba(34, 211, 238, 0.5);
        }

        .action-time {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(148, 163, 184, 0.6);
          min-width: 60px;
          padding-top: 2px;
        }

        .action-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .action-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: rgba(226, 232, 240, 0.9);
          line-height: 1.3;
        }

        .action-station {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(148, 163, 184, 0.7);
        }

        .action-impact {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid;
          align-self: flex-start;
          font-weight: 500;
        }

        .action-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .action-status {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          padding: 2px 4px;
          border-radius: 3px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .action-status.executing {
          background: rgba(6, 182, 212, 0.2);
          color: #06b6d4;
          border: 1px solid rgba(6, 182, 212, 0.3);
        }

        .action-status.completed {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .action-status.failed {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        /* Tabbed Interface Styles */
        .tabbed-content {
          display: flex;
          flex-direction: column;
          height: 280px;
        }

        .tab-header {
          display: flex;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
          margin-bottom: 16px;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
          -webkit-overflow-scrolling: touch;
        }

        .tab-header::-webkit-scrollbar {
          height: 4px;
        }

        .tab-header::-webkit-scrollbar-track {
          background: transparent;
        }

        .tab-header::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 2px;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: none;
          border: none;
          color: rgba(148, 163, 184, 0.7);
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .tab-button:hover {
          color: rgba(226, 232, 240, 0.9);
          background: rgba(148, 163, 184, 0.05);
        }

        .tab-button.active {
          color: rgba(34, 211, 238, 0.9);
          border-bottom-color: #22d3ee;
          background: rgba(34, 211, 238, 0.05);
        }

        .tab-content {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .no-content {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: rgba(148, 163, 184, 0.6);
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
        }

        /* Recovery Tab Styles */
        .recovery-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
          max-height: 200px;
        }

        .recovery-item {
          background: rgba(148, 163, 184, 0.03);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 8px;
          padding: 12px;
        }

        .recovery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .recovery-station {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .station-id {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: rgba(226, 232, 240, 0.9);
          font-weight: 600;
        }

        .recovery-phase {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .recovery-phase.identified {
          background: rgba(148, 163, 184, 0.2);
          color: #94a3b8;
          border: 1px solid rgba(148, 163, 184, 0.3);
        }

        .recovery-phase.analyzing {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.3);
        }

        .recovery-phase.diagnosing {
          background: rgba(249, 115, 22, 0.2);
          color: #f97316;
          border: 1px solid rgba(249, 115, 22, 0.3);
        }

        .recovery-phase.processing {
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .recovery-phase.stabilizing {
          background: rgba(6, 182, 212, 0.2);
          color: #06b6d4;
          border: 1px solid rgba(6, 182, 212, 0.3);
        }

        .recovery-phase.stabilized {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .recovery-phase.optimizing {
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .recovery-phase.completed {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .recovery-description {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(148, 163, 184, 0.8);
          margin: 6px 0;
          line-height: 1.3;
        }

        .recovery-timer {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(148, 163, 184, 0.8);
          background: rgba(148, 163, 184, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .recovery-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .progress-bar {
          flex: 1;
          height: 6px;
          background: rgba(148, 163, 184, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #06b6d4, #10b981);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(148, 163, 184, 0.8);
          min-width: 35px;
        }

        .recovery-status {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(148, 163, 184, 0.7);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.critical {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .status-badge.warning {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.3);
        }

        .status-badge.safe {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .arrow {
          color: rgba(148, 163, 184, 0.5);
          font-size: 12px;
        }

        /* Logs Tab Styles */
        .logs-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow-y: auto;
          max-height: 200px;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.2) transparent;
        }

        .logs-list::-webkit-scrollbar {
          width: 4px;
        }

        .logs-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .logs-list::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 2px;
        }

        .log-item {
          display: flex;
          gap: 10px;
          padding: 6px 8px;
          background: rgba(148, 163, 184, 0.02);
          border-radius: 4px;
          border-left: 2px solid rgba(148, 163, 184, 0.2);
        }

        .log-time {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: rgba(148, 163, 184, 0.6);
          min-width: 55px;
          padding-top: 1px;
        }

        .log-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .log-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .log-level {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          padding: 1px 4px;
          border-radius: 2px;
          font-weight: 600;
          text-transform: uppercase;
          min-width: 35px;
          text-align: center;
        }

        .log-level.info {
          background: rgba(6, 182, 212, 0.2);
          color: #06b6d4;
        }

        .log-level.warn {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .log-level.error {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .log-level.success {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .log-module {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: rgba(148, 163, 184, 0.7);
        }

        .log-message {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(226, 232, 240, 0.9);
          line-height: 1.3;
        }

        .log-details {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(148, 163, 184, 0.7);
          font-style: italic;
        }

        /* Performance Tab Styles */
        .performance-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .health-overview {
          background: rgba(148, 163, 184, 0.03);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 8px;
          padding: 12px;
        }

        .health-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .health-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(148, 163, 184, 0.8);
          font-weight: 600;
        }

        .health-status {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .health-status.excellent {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .health-status.good {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .health-status.fair {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .health-status.poor {
          background: rgba(249, 115, 22, 0.2);
          color: #f97316;
        }

        .health-status.critical {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .health-metrics {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .health-metric {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .metric-name {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(148, 163, 184, 0.8);
          min-width: 80px;
        }

        .metric-bar {
          flex: 1;
          height: 4px;
          background: rgba(148, 163, 184, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .metric-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .metric-fill.normal {
          background: linear-gradient(90deg, #10b981, #34d399);
        }

        .metric-fill.warning {
          background: linear-gradient(90deg, #f59e0b, #fbbf24);
        }

        .metric-fill.critical {
          background: linear-gradient(90deg, #ef4444, #f87171);
        }

        .metric-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(148, 163, 184, 0.8);
          min-width: 40px;
          text-align: right;
        }

        .section-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(148, 163, 184, 0.8);
          font-weight: 600;
          margin-bottom: 8px;
        }

        .recommendations-section, .alerts-section {
          background: rgba(148, 163, 184, 0.02);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 6px;
          padding: 10px;
        }

        .recommendations-list, .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .recommendation-item, .alert-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(148, 163, 184, 0.8);
        }

        .rec-bullet {
          color: rgba(34, 211, 238, 0.7);
        }

        /* Predictions Tab Styles */
        .predictions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
          max-height: 200px;
        }

        .prediction-item {
          background: rgba(148, 163, 184, 0.03);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 8px;
          padding: 12px;
        }

        .prediction-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .prediction-type {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .type-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          padding: 2px 4px;
          border-radius: 3px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .type-badge.fault_risk {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .type-badge.demand_forecast {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .type-badge.maintenance_schedule {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .type-badge.optimization_opportunity {
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
        }

        .severity-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          padding: 1px 3px;
          border-radius: 2px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .severity-badge.low {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .severity-badge.medium {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .severity-badge.high {
          background: rgba(249, 115, 22, 0.2);
          color: #f97316;
        }

        .severity-badge.critical {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .prediction-confidence {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: rgba(148, 163, 184, 0.7);
        }

        .prediction-description {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(226, 232, 240, 0.9);
          margin-bottom: 6px;
          line-height: 1.3;
        }

        .prediction-timeframe {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(148, 163, 184, 0.7);
          margin-bottom: 8px;
        }

        .prediction-recommendations {
          background: rgba(148, 163, 184, 0.05);
          border-radius: 4px;
          padding: 6px;
        }

        .rec-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: rgba(148, 163, 184, 0.8);
          font-weight: 600;
          margin-bottom: 4px;
        }

        .rec-item {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: rgba(148, 163, 184, 0.7);
          line-height: 1.2;
        }

        /* Security Tab Styles */
        .security-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .security-overview {
          background: rgba(148, 163, 184, 0.03);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 8px;
          padding: 12px;
        }

        .security-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .security-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(148, 163, 184, 0.8);
          font-weight: 600;
        }

        .threat-level {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .threat-level.green {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .threat-level.yellow {
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.2);
        }

        .threat-level.orange {
          background: rgba(249, 115, 22, 0.1);
          border: 1px solid rgba(249, 115, 22, 0.2);
        }

        .threat-level.red {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .threat-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .threat-level.green .threat-indicator {
          background: #10b981;
        }

        .threat-level.yellow .threat-indicator {
          background: #fbbf24;
        }

        .threat-level.orange .threat-indicator {
          background: #f97316;
        }

        .threat-level.red .threat-indicator {
          background: #ef4444;
          animation: pulse-critical 1s ease-in-out infinite;
        }

        .threat-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: 600;
        }

        .threat-level.green .threat-text {
          color: #10b981;
        }

        .threat-level.yellow .threat-text {
          color: #fbbf24;
        }

        .threat-level.orange .threat-text {
          color: #f97316;
        }

        .threat-level.red .threat-text {
          color: #ef4444;
        }

        .security-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .security-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: rgba(148, 163, 184, 0.7);
        }

        .stat-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          color: rgba(226, 232, 240, 0.9);
        }

        .stat-value.active {
          color: #10b981;
        }

        .stat-value.degraded {
          color: #fbbf24;
        }

        .stat-value.compromised {
          color: #ef4444;
        }

        .threats-section {
          background: rgba(148, 163, 184, 0.02);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 6px;
          padding: 10px;
        }

        .threats-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .threat-item {
          background: rgba(148, 163, 184, 0.03);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 6px;
          padding: 8px;
        }

        .threat-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .threat-type {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          padding: 1px 4px;
          border-radius: 3px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .threat-type.unauthorized_access {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .threat-type.system_intrusion {
          background: rgba(220, 38, 127, 0.2);
          color: #ec4899;
        }

        .threat-type.ddos_attack {
          background: rgba(249, 115, 22, 0.2);
          color: #f97316;
        }

        .threat-type.data_breach {
          background: rgba(147, 51, 234, 0.2);
          color: #9333ea;
        }

        .threat-type.anomalous_behavior {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .threat-severity {
          font-family: 'JetBrains Mono', monospace;
          font-size: 7px;
          padding: 1px 3px;
          border-radius: 2px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .threat-severity.low {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .threat-severity.medium {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .threat-severity.high {
          background: rgba(249, 115, 22, 0.2);
          color: #f97316;
        }

        .threat-severity.critical {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .threat-time {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          color: rgba(148, 163, 184, 0.6);
          margin-left: auto;
        }

        .threat-description {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(226, 232, 240, 0.9);
          margin-bottom: 2px;
          line-height: 1.3;
        }

        .threat-source {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: rgba(148, 163, 184, 0.7);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .grid-regulation-terminal {
            width: calc(100vw - 20px);
            bottom: 10px;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .header-left {
            gap: 12px;
          }

          .efficiency-display {
            padding: 3px 6px;
          }

          .efficiency-value {
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .terminal-header {
            padding: 12px 16px;
          }

          .terminal-content {
            padding: 16px;
          }

          .system-label {
            font-size: 11px;
          }

          .active-agents {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
  } catch (error) {
    console.error('🚨 GridRegulationTerminal Error:', error);
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
        ⚠️ AI Terminal Error: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }
};

export default GridRegulationTerminal;