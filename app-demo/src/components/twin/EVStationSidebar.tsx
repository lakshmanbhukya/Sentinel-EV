import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDemoStore } from '../../store/useDemoStore';
import { useRecoveryStore } from '../../store/useRecoveryStore';
import { X, Thermometer, Zap, Maximize2, Minimize2, Activity, Cpu, Shield, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine, CartesianGrid, Tooltip } from 'recharts';
import { cn } from '../../lib/utils';
import MonthlyUsageHeatmap from '../analytics/MonthlyUsageHeatmap';
import DemandPredictionGraph from '../analytics/DemandPredictionGraph';
import OperationalMetrics from '../analytics/OperationalMetrics';
import ActionRecommendation from '../analytics/ActionRecommendation';
import BookingPanel from '../booking/BookingPanel'; 
import { generateStationMetrics } from '../../data/mockAnalyticsData';
import { useHourlyDemand, useDemandPrediction } from '../../hooks/useAnalyticsData';
import { useConditionalAgent } from '../../agent/integration/AgentEnabledWrapper';
import { getMetricsByStatus, generateStatusBasedEnergyData, getOperationalDataByStatus } from '../../data/statusBasedMockData';
import { simulateRecovery } from '../../utils/recoverySimulation';

export default function EVEnergyTwinSidebar() {
  const { selectedStation, selectStation, updateStationStatus } = useDemoStore();
  const { startRecovery, updateRecoveryProgress, completeRecovery, isRecovering: checkIsRecovering, getRecoveryProgress } = useRecoveryStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const recoveryCleanupRef = useRef<(() => void) | null>(null);
  
  const isRecovering = selectedStation ? checkIsRecovering(selectedStation.id) : false;
  const recoveryProgress = selectedStation ? getRecoveryProgress(selectedStation.id) : null;
  
  // Use agent context (safe - returns defaults if agent not enabled)
  const { 
    isAgentEnabled, 
    isStationAgentActive, 
    agentState, 
    activateAgent 
  } = useConditionalAgent(selectedStation?.id);
  
  // Use Analytics Hooks
  const { data: heatmapData, isMock: isHeatmapMock } = useHourlyDemand(selectedStation?.id || '');
  const { data: demandPrediction, isMock: isPredictionMock } = useDemandPrediction(selectedStation?.id || '');
  
  // Cleanup recovery on unmount or station change
  useEffect(() => {
    return () => {
      if (recoveryCleanupRef.current) {
        recoveryCleanupRef.current();
      }
    };
  }, [selectedStation?.id]);
  
  // Start recovery simulation
  const handleStartRecovery = () => {
    if (!selectedStation || selectedStation.status !== 'critical') return;
    
    startRecovery(selectedStation.id);
    
    const cleanup = simulateRecovery(
      selectedStation,
      (progress) => {
        updateRecoveryProgress(selectedStation.id, progress);
        
        // Update station status in store when phase changes
        if (progress.phase === 'warning' && selectedStation.status === 'critical') {
          updateStationStatus(selectedStation.id, 'warning');
        } else if (progress.phase === 'safe' && selectedStation.status === 'warning') {
          updateStationStatus(selectedStation.id, 'safe');
        }
      },
      () => {
        // Recovery complete
        completeRecovery(selectedStation.id);
        if (selectedStation) {
          updateStationStatus(selectedStation.id, 'safe');
        }
      }
    );
    
    recoveryCleanupRef.current = cleanup;
  };
  
  if (!selectedStation) return null;

  // Use recovery progress metrics if recovering, otherwise use status-based metrics
  const baseMetrics = getMetricsByStatus(selectedStation.status as 'critical' | 'warning' | 'safe');
  const statusMetrics = isRecovering && recoveryProgress ? {
    ...baseMetrics,
    oilTemp: recoveryProgress.currentTemp,
    load: recoveryProgress.currentLoad,
    efficiency: recoveryProgress.currentEfficiency,
    uptime: recoveryProgress.currentUptime,
  } : baseMetrics;
  
  const operationalData = getOperationalDataByStatus(selectedStation.status as 'critical' | 'warning' | 'safe');
  
  const isCritical = selectedStation.status === 'critical';
  const isWarning = selectedStation.status === 'warning';
  
  // Use status-based energy data
  const data = generateStatusBasedEnergyData(selectedStation.status as 'critical' | 'warning' | 'safe');
  
  const stationMetrics = generateStationMetrics(selectedStation.id);

  return (
    <AnimatePresence>
      {selectedStation && (
        <motion.div 
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className={cn(
            "fixed right-6 top-6 bottom-6 glass-panel-heavy rounded-2xl z-[1000] flex flex-col overflow-hidden transition-all duration-300 ease-in-out border-l-0 border border-slate-700/50 shadow-[0_0_50px_rgba(0,0,0,0.5)]",
            isExpanded ? "w-[700px]" : "w-[450px]"
          )}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 bg-white/5 backdrop-blur-3xl">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">ID: {selectedStation.id}</span>
                    
                    {/* Agent Status Indicator - Only shows when agent is enabled */}
                    {isAgentEnabled && (
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3 text-cyan-400" />
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded font-mono border",
                          isStationAgentActive 
                            ? "bg-cyan-900/50 text-cyan-300 border-cyan-700" 
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        )}>
                          AI: {isStationAgentActive ? agentState?.phase || 'ACTIVE' : 'STANDBY'}
                        </span>
                        
                        {!isStationAgentActive && selectedStation.status === 'critical' && (
                          <button
                            onClick={activateAgent}
                            className="text-[9px] px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-mono transition-colors"
                          >
                            ACTIVATE
                          </button>
                        )}
                      </div>
                    )}
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{selectedStation.name}</h2>
                <div className="text-xs text-neon-cyan mt-1 flex items-center gap-2 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
                  DIGITAL TWIN CONNECTED
                  
                  {/* Agent Activity Indicator */}
                  {isAgentEnabled && isStationAgentActive && agentState && (
                    <>
                      <span className="text-slate-500">•</span>
                      <span className={cn(
                        "text-xs",
                        agentState.phase === 'STABLE' ? "text-green-400" :
                        agentState.phase === 'CRITICAL' ? "text-red-400" :
                        agentState.phase === 'DIAGNOSING' ? "text-yellow-400" :
                        agentState.phase === 'EXECUTING' ? "text-blue-400" :
                        "text-green-400"
                      )}>
                        AI {agentState.phase}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                    title={isExpanded ? "Collapse" : "Expand"}
                >
                    {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
                <button 
                    onClick={() => selectStation(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            
            {/* Action Recommendation */}
            <ActionRecommendation status={selectedStation.status as any} predictedPeakTime="18:30" />

            {/* Recovery System - Button Only */}
            {isCritical && !isRecovering && (
              <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-1">
                      Emergency Recovery Available
                    </h3>
                    <p className="text-xs text-slate-400">
                      Initiate automated recovery protocol - Progress will be shown in AI Agent Terminal
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recovery Status Indicator (Minimal) */}
            {isRecovering && recoveryProgress && (
              <div className={cn(
                "border rounded-xl p-3 backdrop-blur-sm flex items-center justify-between",
                recoveryProgress.phase === 'critical' ? "bg-red-900/20 border-red-700/50" :
                recoveryProgress.phase === 'warning' ? "bg-amber-900/20 border-amber-700/50" :
                "bg-emerald-900/20 border-emerald-700/50"
              )}>
                <div className="flex items-center gap-2">
                  <RefreshCw className={cn(
                    "w-4 h-4 animate-spin",
                    recoveryProgress.phase === 'critical' ? "text-red-400" :
                    recoveryProgress.phase === 'warning' ? "text-amber-400" :
                    "text-emerald-400"
                  )} />
                  <span className={cn(
                    "text-sm font-bold uppercase",
                    recoveryProgress.phase === 'critical' ? "text-red-400" :
                    recoveryProgress.phase === 'warning' ? "text-amber-400" :
                    "text-emerald-400"
                  )}>
                    Recovery in Progress
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Check AI Agent Terminal →
                </span>
              </div>
            )}

            {/* New Booking Panel */}
            <BookingPanel stationId={selectedStation.id} />

            {/* 3D Model / Asset Visual */}
            <div className="relative aspect-[2/1] rounded-xl bg-[#02040a] border border-slate-800 overflow-hidden group shadow-inner">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#02040a] to-[#02040a]"></div>
                
                {/* Simulated Grid Lines */}
                <div className="absolute inset-0 bg-grid-void opacity-50"></div>

                <div className="absolute inset-0 flex items-center justify-center text-slate-700">
                    <Zap className={cn("w-24 h-24 opacity-80 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-1000", isCritical ? "text-plasma animate-pulse" : "text-neon-cyan")} />
                </div>
                
                {/* Overlay Text */}
                <div className="absolute top-4 left-4 font-mono text-[10px] text-slate-500 space-y-1">
                    <div>VOLTAGE: {statusMetrics.voltage}</div>
                    <div>FREQ: {statusMetrics.frequency}</div>
                </div>
                <div className="absolute bottom-4 right-4 text-xs font-mono">
                    <span className={cn(
                      isCritical ? "text-plasma" : isWarning ? "text-amber-400" : "text-neon-cyan"
                    )}>
                        {statusMetrics.statusMessage}
                    </span>
                </div>
            </div>

            {/* Operational Intelligence Section */}
            <div className="space-y-6">
                
                {/* 1. Key Metrics Grid */}
                <div>
                   <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
                        <Cpu className="w-3 h-3" />
                        Real-time Telemetry
                   </h3>
                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                          <div className="flex items-center gap-2 text-slate-400 mb-3">
                              <Thermometer className="w-4 h-4 text-slate-500" />
                              <span className="text-[10px] uppercase tracking-widest font-bold">Oil Temp</span>
                          </div>
                          <div className="flex items-end gap-2">
                            <div className={cn(
                              "text-3xl font-mono font-bold leading-none", 
                              isCritical ? "text-plasma" : isWarning ? "text-amber-400" : "text-white"
                            )}>
                                {statusMetrics.oilTemp}°
                            </div>
                            <div className="text-[10px] text-slate-500 mb-1">/ 110° MAX</div>
                          </div>
                          {/* Mini Bar */}
                          <div className="w-full h-1 bg-slate-800 rounded-full mt-3 overflow-hidden">
                              <div className={cn(
                                "h-full rounded-full transition-all duration-500", 
                                isCritical ? "bg-plasma" : isWarning ? "bg-amber-500" : "bg-blue-500"
                              )} style={{ width: `${(statusMetrics.oilTemp / 110) * 100}%` }}></div>
                          </div>
                       </div>
                       
                       <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                          <div className="flex items-center gap-2 text-slate-400 mb-3">
                              <Zap className="w-4 h-4 text-slate-500" />
                              <span className="text-[10px] uppercase tracking-widest font-bold">Load</span>
                          </div>
                          <div className="flex items-end gap-2">
                            <div className={cn(
                              "text-3xl font-mono font-bold leading-none", 
                              isCritical ? "text-plasma" : isWarning ? "text-amber-400" : "text-white"
                            )}>
                                {statusMetrics.load}<span className="text-lg">%</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mb-1">CAPACITY</div>
                          </div>
                          <div className="w-full h-1 bg-slate-800 rounded-full mt-3 overflow-hidden">
                              <div className={cn(
                                "h-full rounded-full transition-all duration-500", 
                                isCritical ? "bg-plasma" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                              )} style={{ width: `${statusMetrics.load}%` }}></div>
                          </div>
                       </div>
                   </div>
                </div>

                {/* Additional Status-Specific Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-700/50">
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Efficiency</div>
                    <div className={cn(
                      "text-xl font-mono font-bold",
                      statusMetrics.efficiency >= 95 ? "text-emerald-400" :
                      statusMetrics.efficiency >= 85 ? "text-amber-400" : "text-red-400"
                    )}>
                      {statusMetrics.efficiency}%
                    </div>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-700/50">
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Uptime</div>
                    <div className={cn(
                      "text-xl font-mono font-bold",
                      statusMetrics.uptime >= 98 ? "text-emerald-400" :
                      statusMetrics.uptime >= 90 ? "text-amber-400" : "text-red-400"
                    )}>
                      {statusMetrics.uptime}%
                    </div>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-700/50">
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Power Factor</div>
                    <div className={cn(
                      "text-xl font-mono font-bold",
                      statusMetrics.powerFactor >= 0.92 ? "text-emerald-400" :
                      statusMetrics.powerFactor >= 0.85 ? "text-amber-400" : "text-red-400"
                    )}>
                      {statusMetrics.powerFactor}
                    </div>
                  </div>
                </div>

                {/* System Status Banner */}
                <div className={cn(
                  "p-4 rounded-xl border backdrop-blur-sm",
                  isCritical ? "bg-red-900/20 border-red-700/50" :
                  isWarning ? "bg-amber-900/20 border-amber-700/50" :
                  "bg-emerald-900/20 border-emerald-700/50"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full animate-pulse",
                      isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                    )} />
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-emerald-400"
                    )}>
                      {statusMetrics.systemStatus}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {statusMetrics.recommendations.map((rec, idx) => (
                      <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-slate-500 mt-0.5">•</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operational Data */}
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/50">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Station Activity</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-slate-500 mb-1">Active Chargers</div>
                      <div className="text-2xl font-mono font-bold text-white">
                        {operationalData.activeChargers}<span className="text-sm text-slate-500">/{operationalData.totalChargers}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 mb-1">Utilization</div>
                      <div className={cn(
                        "text-2xl font-mono font-bold",
                        operationalData.utilizationRate >= 90 ? "text-red-400" :
                        operationalData.utilizationRate >= 70 ? "text-amber-400" : "text-emerald-400"
                      )}>
                        {operationalData.utilizationRate}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 mb-1">Energy Delivered</div>
                      <div className="text-lg font-mono font-bold text-white">{operationalData.energyDelivered}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 mb-1">Peak Demand</div>
                      <div className="text-lg font-mono font-bold text-white">{operationalData.peakDemand}</div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

                {/* 2. Operations & Efficiency */}
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
                        <Activity className="w-3 h-3" />
                        Operational Intelligence
                   </h3>
                   <OperationalMetrics metrics={stationMetrics} />
                </div>

                {/* 3. Demand Prediction */}
                <div className="relative">
                   <DemandPredictionGraph data={demandPrediction} />
                   {!isPredictionMock && <div className="absolute top-2 right-2 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse"></div><span className="text-[8px] text-neon-cyan font-mono">ML Live</span></div>}
                </div>

                {/* 4. Usage Patterns */}
                <div className="relative">
                   <MonthlyUsageHeatmap data={heatmapData} />
                   {!isHeatmapMock && <div className="absolute top-2 right-2 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse"></div><span className="text-[8px] text-neon-cyan font-mono">Live Data</span></div>}
                </div>

                {/* Live Energy Monitoring */}
                <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Energy Flow</h3>
                      <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></div>
                          <span className="text-[10px] text-neon-cyan font-mono">LIVE</span>
                      </div>
                  </div>
                  <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor={
                                        isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#22d3ee"
                                      } stopOpacity={0.4}/>
                                      <stop offset="95%" stopColor={
                                        isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#22d3ee"
                                      } stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                              <XAxis 
                                dataKey="time" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false} 
                                tick={{ fill: '#64748b' }}
                                minTickGap={30}
                              />
                              <YAxis 
                                domain={[40, 130]} 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false} 
                                tick={{ fill: '#64748b' }}
                              />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                itemStyle={{ color: '#e2e8f0', fontFamily: 'monospace' }}
                                labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
                              />
                              <ReferenceLine y={110} stroke="#ef4444" strokeDasharray="3 3" />
                              <Area 
                                  type="monotone" 
                                  dataKey="temp" 
                                  stroke={isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#22d3ee"} 
                                  strokeWidth={2}
                                  fillOpacity={1} 
                                  fill="url(#colorTemp)" 
                              />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
                </div>

            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
