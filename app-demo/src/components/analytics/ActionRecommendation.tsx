import { AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface ActionRecommendationProps {
  status: 'safe' | 'warning' | 'critical';
  predictedPeakTime?: string;
}

export default function ActionRecommendation({ status, predictedPeakTime }: ActionRecommendationProps) {
  let borderColor = '';
  let bgGradient = '';
  let icon = null;
  let title = '';
  let subtitle = '';

  if (status === 'critical') {
    borderColor = 'border-plasma';
    bgGradient = 'from-plasma/20 to-plasma/5';
    icon = <AlertTriangle className="w-6 h-6 text-plasma animate-pulse" />;
    title = 'GRID STRESS DETECTED';
    subtitle = 'Avoid charging. Peak load event in progress.';
  } else if (status === 'warning') {
    borderColor = 'border-amber-500';
    bgGradient = 'from-amber-500/20 to-amber-500/5';
    icon = <Zap className="w-6 h-6 text-amber-500" />;
    title = 'LOAD BALANCING ACTIVE';
    subtitle = predictedPeakTime ? `Predicted peak at ${predictedPeakTime}. Charge now.` : 'Grid load increasing.';
  } else {
    borderColor = 'border-neon-lime';
    bgGradient = 'from-neon-lime/20 to-neon-lime/5';
    icon = <ShieldCheck className="w-6 h-6 text-neon-lime" />;
    title = 'OPTIMAL CONDITION';
    subtitle = 'Grid is stable. High-speed charging available.';
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border ${borderColor} bg-gradient-to-br ${bgGradient} p-1`}>
      <div className="absolute inset-0 bg-grid-void opacity-30"></div>
      <div className="relative bg-slate-900/40 backdrop-blur-sm p-4 rounded-lg flex items-center gap-4">
        <div className={`p-3 rounded-full bg-slate-900 border border-slate-700 shadow-lg`}>
          {icon}
        </div>
        <div>
          <h3 className={`font-mono font-bold text-sm tracking-widest ${status === 'critical' ? 'text-plasma' : status === 'warning' ? 'text-amber-400' : 'text-neon-lime'}`}>
            {title}
          </h3>
          <p className="text-slate-300 text-xs mt-1">{subtitle}</p>
        </div>
        {status === 'safe' && (
            <div className="ml-auto">
                <button className="bg-neon-lime/20 text-neon-lime text-xs font-bold px-3 py-1.5 rounded uppercase hover:bg-neon-lime/30 transition-colors border border-neon-lime/30">
                    Connect
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
