import type { OperationalMetrics as MetricsType } from '../../data/mockAnalyticsData';
import { Zap, Clock, Leaf, BarChart3 } from 'lucide-react';

interface OperationalMetricsProps {
  metrics: MetricsType;
}

export default function OperationalMetrics({ metrics }: OperationalMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Card 1: Optimal Hours */}
        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wider">Optimal Charge</span>
            </div>
            <div className="text-sm font-semibold text-white">
                {metrics.optimalHours.join(' & ')}
            </div>
        </div>

        {/* Card 2: Energy Delivered */}
        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wider">Energy (24h)</span>
            </div>
            <div className="text-sm font-semibold text-white">
                {metrics.energyDelivered.toLocaleString()} <span className="text-xs text-slate-500 font-normal">kWh</span>
            </div>
        </div>

        {/* Card 3: Carbon Saved */}
        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wider">CO2 Saved</span>
            </div>
            <div className="text-sm font-semibold text-white">
                {metrics.carbonSaved} <span className="text-xs text-slate-500 font-normal">kg</span>
            </div>
        </div>

        {/* Card 4: Utilization */}
        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wider">Usage Rate</span>
            </div>
            <div className="text-sm font-semibold text-white">
                {metrics.utilizationRate}%
            </div>
        </div>
    </div>
  );
}
