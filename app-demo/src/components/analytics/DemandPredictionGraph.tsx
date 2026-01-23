import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import type { DemandPredictionPoint } from '../../data/mockAnalyticsData';

interface DemandPredictionGraphProps {
  data: DemandPredictionPoint[];
}

export default function DemandPredictionGraph({ data }: DemandPredictionGraphProps) {
  return (
    <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div>
           <h3 className="text-sm font-medium text-slate-300">Demand Forecast (AI Model v2)</h3>
           <p className="text-[10px] text-slate-500">Upcoming 12h Peak Load Prediction</p>
        </div>
      </div>
      
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
             <defs>
                {/* Predicted Area Gradient */}
                <linearGradient id="predGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} interval={3} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
              itemStyle={{ fontSize: '12px' }}
              labelStyle={{ color: '#94a3b8', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', opacity: 0.7 }} />

            {/* Actual Demand Line */}
            <Line 
              type="monotone" 
              dataKey="actual" 
              name="Actual Demand" 
              stroke="#10b981" 
              strokeWidth={2} 
              dot={false}
            />

            {/* Predicted Demand Area (Range) */}
            <Area
              type="monotone"
              dataKey="upperBound"
              stroke="none"
              fill="url(#predGradient)"
              connectNulls
            />

            {/* Predicted Line (Dashed) */}
            <Line 
              type="monotone" 
              dataKey="predicted" 
              name="AI Prediction" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              dot={false}
              connectNulls
            />

            {/* Threshold Line */}
            <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'GRID LIMIT', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
