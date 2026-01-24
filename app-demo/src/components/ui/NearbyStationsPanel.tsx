import { Zap, Activity, Thermometer, Navigation, MoreHorizontal, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import type { Station } from '../../data/mockData';
import { CITY_STATIONS, type CityData } from '../../data/cityStationsData';
import CitySelector from './CitySelector';

interface NearbyStationsPanelProps {
    stations: Station[];
    selectedStationId: string | null;
    onSelectStation: (id: string, s: Station) => void;
    onNavigate: (lat: number, lng: number) => void;
    enableCitySelector?: boolean; // New optional prop
}

export default function NearbyStationsPanel({ 
    stations, 
    selectedStationId, 
    onSelectStation, 
    onNavigate,
    enableCitySelector = true 
}: NearbyStationsPanelProps) {
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [cityStations, setCityStations] = useState<Station[]>([]);
    
    // Use city stations if a city is selected, otherwise use prop stations
    const displayStations = selectedCity ? cityStations : stations;
    
    const handleCitySelect = (city: CityData) => {
        setSelectedCity(city.name);
        setCityStations(CITY_STATIONS[city.name] || []);
    };
    
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
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* City Selector */}
            {enableCitySelector && (
                <CitySelector 
                    selectedCity={selectedCity} 
                    onCitySelect={handleCitySelect} 
                />
            )}
            
            {/* Station List */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-6 pb-6 space-y-3">
                    {displayStations.length === 0 && selectedCity && (
                        <div className="text-center py-8 text-slate-400">
                            <p>No stations found in {selectedCity}</p>
                        </div>
                    )}
                    {displayStations.length === 0 && !selectedCity && (
                        <div className="text-center py-8 text-slate-400">
                            <p>Select a city to view EV stations</p>
                        </div>
                    )}
                    {displayStations.map(st => {
                    const StatusIcon = getStatusIcon(st.status);
                    const isSelected = selectedStationId === st.id;
                    
                    return (
                        <div
                            key={st.id}
                            className={`bg-slate-800/30 rounded-lg p-4 cursor-pointer transition-all hover:bg-slate-700/40 border ${
                                isSelected ? 'border-blue-500/50 bg-blue-900/20' : 'border-slate-700/30'
                            }`}
                            onClick={() => onSelectStation(st.id, st)}
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
                                    <span className="text-slate-500 text-xs">#{st.id}</span>
                                </div>
                                <button className="text-slate-400 hover:text-white transition-colors">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {/* Title */}
                            <h3 className="text-white font-medium mb-1 truncate">
                                {st.name}
                            </h3>
                            <div className="text-slate-400 text-sm mb-4 truncate">
                                {st.address}
                            </div>
                            
                            {/* Metrics Strip */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className="bg-slate-900/40 rounded p-2 text-center">
                                    <div className="text-[10px] text-slate-500 uppercase mb-1">Slots</div>
                                    <div className="flex items-center justify-center gap-1">
                                        <Zap className="w-3 h-3 text-blue-400" />
                                        <span className="text-sm font-bold text-slate-200">
                                            {(st as any).capacity || 8}
                                        </span>
                                    </div>
                                    {/* (st as any).capacity check: Station interface might not have capacity yet if strictly from mockData. 
                                        But enhanced stations in store might. For robust demo, we fallback to 8. */}
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
                                        onNavigate(st.lat, st.lng);
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
        </div>
    );
}
