import { Zap, Activity, Thermometer, Navigation, MoreHorizontal, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

// Reusing types from SentinelMap for consistency, but locally defined to avoid circular deps if needed.
// In a real app, these would be in a shared type file.
interface Station {
    ID: number;
    AddressInfo: {
        Title: string;
        Latitude: number;
        Longitude: number;
        AddressLine1: string;
    };
    // Derived props passed down
    capacity: number;
    status: 'safe' | 'warning' | 'critical';
    load: number;
    temp: number;
}

interface NearbyStationsPanelProps {
    stations: Station[];
    selectedStationId: string | null;
    onSelectStation: (id: string, s: any) => void; // Using any for the store payload for simplicity here
    onNavigate: (lat: number, lng: number) => void;
}

export default function NearbyStationsPanel({ stations, selectedStationId, onSelectStation, onNavigate }: NearbyStationsPanelProps) {
    
    // Helper helpers
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'safe': return 'text-emerald-400';
            case 'warning': return 'text-amber-400';
            case 'critical': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };
    
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'safe': return CheckCircle;
            case 'warning': return Clock;
            case 'critical': return AlertTriangle;
            default: return Activity;
        }
    };

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="px-6 pb-6 space-y-3">
                {stations.map(st => {
                    const StatusIcon = getStatusIcon(st.status);
                    const isSelected = selectedStationId === st.ID.toString();
                    
                    return (
                        <div
                            key={st.ID}
                            className={`bg-slate-800/30 rounded-lg p-4 cursor-pointer transition-all hover:bg-slate-700/40 border ${
                                isSelected ? 'border-blue-500/50 bg-blue-900/20' : 'border-slate-700/30'
                            }`}
                            onClick={() => onSelectStation(st.ID.toString(), st)}
                        >
                            {/* Header: Status + ID */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/50 border border-slate-700/50`}>
                                        <StatusIcon className={`w-3.5 h-3.5 ${getStatusColor(st.status)}`} />
                                        <span className={`text-xs font-medium uppercase ${getStatusColor(st.status)}`}>
                                            {st.status}
                                        </span>
                                    </div>
                                    <span className="text-slate-500 text-xs">#{st.ID}</span>
                                </div>
                                <button className="text-slate-400 hover:text-white transition-colors">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {/* Title */}
                            <h3 className="text-white font-medium mb-1 truncate">
                                {st.AddressInfo.Title}
                            </h3>
                            <div className="text-slate-400 text-sm mb-4 truncate">
                                {st.AddressInfo.AddressLine1}
                            </div>
                            
                            {/* Metrics Strip */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className="bg-slate-900/40 rounded p-2 text-center">
                                    <div className="text-[10px] text-slate-500 uppercase mb-1">Slots</div>
                                    <div className="flex items-center justify-center gap-1">
                                        <Zap className="w-3 h-3 text-blue-400" />
                                        <span className="text-sm font-bold text-slate-200">{st.capacity}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-900/40 rounded p-2 text-center">
                                    <div className="text-[10px] text-slate-500 uppercase mb-1">Load</div>
                                    <div className="flex items-center justify-center gap-1">
                                        <Activity className="w-3 h-3 text-emerald-400" />
                                        <span className="text-sm font-bold text-slate-200">{st.load}%</span>
                                    </div>
                                </div>
                                <div className="bg-slate-900/40 rounded p-2 text-center">
                                    <div className="text-[10px] text-slate-500 uppercase mb-1">Temp</div>
                                    <div className="flex items-center justify-center gap-1">
                                        <Thermometer className="w-3 h-3 text-amber-400" />
                                        <span className={`text-sm font-bold ${st.temp > 80 ? 'text-red-400' : 'text-slate-200'}`}>{st.temp}°</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-700/30">
                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    Operational
                                </div>
                                <button
                                    className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded px-3 py-1.5 transition-colors flex items-center gap-1.5"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onNavigate(st.AddressInfo.Latitude, st.AddressInfo.Longitude);
                                    }}
                                >
                                    <Navigation className="w-3 h-3" />
                                    Navigate
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
