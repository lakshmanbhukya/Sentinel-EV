import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDemoStore } from '../../store/useDemoStore';
import { X, Thermometer, Zap, ShieldCheck, AlertTriangle, Maximize2, Minimize2, Activity, Cpu } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine, CartesianGrid, Tooltip } from 'recharts';
import { cn } from '../../lib/utils';
import MonthlyUsageHeatmap from '../analytics/MonthlyUsageHeatmap';
import DemandPredictionGraph from '../analytics/DemandPredictionGraph';
import OperationalMetrics from '../analytics/OperationalMetrics';
import ActionRecommendation from '../analytics/ActionRecommendation';
import BookingPanel from '../booking/BookingPanel'; // Import new panel
import { generateHeatmapData, generateDemandPrediction, generateStationMetrics } from '../../data/mockAnalyticsData';

// Mock simulation data generator
const generateEVEnergyData = (baseTemp: number, isCritical: boolean) => {
  const data = [];
  let currentTemp = baseTemp;
  for (let i = 0; i < 20; i++) {
    const time = new Date();
    time.setMinutes(time.getMinutes() + (i * 15));
    
    // Random fluctuation
    const noise = Math.random() * 2 - 1;
    // Rising trend if critical
    const trend = isCritical ? 0.5 : 0;
    
    currentTemp += trend + noise;
    
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: parseFloat(currentTemp.toFixed(1)),
      limit: 110
    });
  }
  return data;
};

export default function EVEnergyTwinSidebar() {
  const { selectedStation, selectStation } = useDemoStore();
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!selectedStation) return null;

  const isCritical = selectedStation.status === 'critical';
  const data = generateEVEnergyData(selectedStation.temp, isCritical);
  
  // Generate analytics data
  const heatmapData = generateHeatmapData();
  const demandPrediction = generateDemandPrediction();
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
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{selectedStation.name}</h2>
                <div className="text-xs text-neon-cyan mt-1 flex items-center gap-2 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
                  DIGITAL TWIN CONNECTED
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
                    <div>VOLTAGE: 480V</div>
                    <div>FREQ: 60Hz</div>
                </div>
                <div className="absolute bottom-4 right-4 text-xs font-mono">
                    <span className={isCritical ? "text-plasma" : "text-neon-cyan"}>
                        {isCritical ? "⚠ EV ENERGY LIMIT EXCEEDED" : "✓ SYSTEM NOMINAL"}
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
                            <div className={cn("text-3xl font-mono font-bold leading-none", isCritical ? "text-plasma" : "text-white")}>
                                {selectedStation.temp}°
                            </div>
                            <div className="text-[10px] text-slate-500 mb-1">/ 110° MAX</div>
                          </div>
                          {/* Mini Bar */}
                          <div className="w-full h-1 bg-slate-800 rounded-full mt-3 overflow-hidden">
                              <div className={cn("h-full rounded-full transition-all duration-500", isCritical ? "bg-plasma" : "bg-blue-500")} style={{ width: `${(selectedStation.temp / 110) * 100}%` }}></div>
                          </div>
                       </div>
                       
                       <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                          <div className="flex items-center gap-2 text-slate-400 mb-3">
                              <Zap className="w-4 h-4 text-slate-500" />
                              <span className="text-[10px] uppercase tracking-widest font-bold">Load</span>
                          </div>
                          <div className="flex items-end gap-2">
                            <div className={cn("text-3xl font-mono font-bold leading-none", isCritical ? "text-amber-500" : "text-white")}>
                                {selectedStation.load}<span className="text-lg">%</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mb-1">CAPACITY</div>
                          </div>
                          <div className="w-full h-1 bg-slate-800 rounded-full mt-3 overflow-hidden">
                              <div className={cn("h-full rounded-full transition-all duration-500", isCritical ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${selectedStation.load}%` }}></div>
                          </div>
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
                <DemandPredictionGraph data={demandPrediction} />

                {/* 4. Usage Patterns */}
                <MonthlyUsageHeatmap data={heatmapData} />

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
                                      <stop offset="5%" stopColor={isCritical ? "#ef4444" : "#22d3ee"} stopOpacity={0.4}/>
                                      <stop offset="95%" stopColor={isCritical ? "#ef4444" : "#22d3ee"} stopOpacity={0}/>
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
                                  stroke={isCritical ? "#ef4444" : "#22d3ee"} 
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
