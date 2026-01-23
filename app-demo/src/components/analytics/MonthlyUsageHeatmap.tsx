import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { HeatmapDataPoint } from '../../data/mockAnalyticsData';

interface MonthlyUsageHeatmapProps {
  data: HeatmapDataPoint[];
}

export default function MonthlyUsageHeatmap({ data }: MonthlyUsageHeatmapProps) {
  // Define color stops for the gradient sensation
  const getColor = (value: number) => {
    if (value < 30) return '#10b981'; // Green (Low)
    if (value < 70) return '#f59e0b'; // Amber (Medium)
    return '#ef4444'; // Red (High)
  };

  return (
    <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-300">Monthly Usage Density</h3>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Low</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Med</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>High</div>
        </div>
      </div>
      
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <XAxis 
              dataKey="hour" 
              type="number" 
              domain={[0, 23]} 
              tickCount={12} 
              tick={{ fill: '#64748b', fontSize: 10 }} 
              tickLine={false}
              axisLine={false}
              interval={1}
            />
            <YAxis 
              dataKey="day" 
              type="category" 
              allowDuplicatedCategory={false} 
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            {/* ZAxis sets the range for bubble size if we wanted variable size, but we want grid blocks */}
            <ZAxis type="number" dataKey="value" range={[0, 100]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-xl text-xs">
                      <p className="font-bold text-slate-200">{d.day} @ {d.hour}:00</p>
                      <p className="text-slate-400">Utilization: <span className="text-white font-mono">{d.value}%</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter data={data} shape="square">
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getColor(entry.value)} 
                  className="transition-all hover:opacity-80"
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
