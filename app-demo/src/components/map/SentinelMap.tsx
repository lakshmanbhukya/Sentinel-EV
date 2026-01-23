import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { Zap, Activity, AlertTriangle, Search } from 'lucide-react';
import { useDemoStore } from '../../store/useDemoStore';
import NearbyStationsPanel from '../ui/NearbyStationsPanel';
import CustomMapMarker from './CustomMapMarker';

// ... (keep generic imports)

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface OCMStation {
    ID: number;
    AddressInfo: {
        Title: string;
        Latitude: number;
        Longitude: number;
        AddressLine1: string;
    };
    Connections: { Quantity?: number }[];
    NumberOfPoints?: number;
}

// Routing Machine Component (kept as is)
function RoutingControl({ userLoc, destLoc }: { userLoc: [number, number] | null, destLoc: [number, number] | null }) {
    const map = useMap();
    const routingControlRef = useRef<L.Routing.Control | null>(null);

    useEffect(() => {
        if (!userLoc || !destLoc) return;

        if (!routingControlRef.current) {
            routingControlRef.current = L.Routing.control({
                waypoints: [
                    L.latLng(userLoc[0], userLoc[1]),
                    L.latLng(destLoc[0], destLoc[1])
                ],
                lineOptions: {
                    styles: [{ color: '#3b82f6', weight: 4, opacity: 0.7 }]
                },
                routeWhileDragging: false,
                addWaypoints: false,
                fitSelectedRoutes: true,
                show: false 
            } as any).addTo(map);
        } else {
            routingControlRef.current.setWaypoints([
                L.latLng(userLoc[0], userLoc[1]),
                L.latLng(destLoc[0], destLoc[1])
            ]);
        }
        return () => {};
    }, [userLoc, destLoc, map]);

    return null;
}

// Helper to update map center when userLocation changes
function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom(), { animate: true });
        }
    }, [center, map]);
    return null;
}

export default function SentinelMap() {
    // ... (keep state)
    const { selectStation } = useDemoStore();
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [stations, setStations] = useState<OCMStation[]>([]);
    const [routeDest, setRouteDest] = useState<[number, number] | null>(null);
    const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

    // 1. Get User Location (FORCED TO BANGALORE for Demo)
    useEffect(() => {
        setUserLocation([12.9716, 77.5946]);
    }, []);

    // ... (keep useEffect for fetching stations)
    // 3. Fetch Nearby Stations (Matched to Working Python Script)
    useEffect(() => {
        if (!userLocation) return;
        
        const fetchWithRadius = async (radius: number): Promise<OCMStation[]> => {
            const apiKey = import.meta.env.VITE_OCM_API_KEY;
            
            const url = `https://api.openchargemap.io/v3/poi/?output=json&latitude=${userLocation[0]}&longitude=${userLocation[1]}&distance=${radius}&distanceunit=KM`;
            
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-API-Key': apiKey, 
                    'User-Agent': 'TransformerSentinelDemo/1.0',
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) throw new Error(`API Error ${res.status}`);
            const data = await res.json();
            return data || [];
        };

        const executeSmartSearch = async () => {
            try {
                let data = await fetchWithRadius(5);
                if (data.length === 0) data = await fetchWithRadius(25);
                if (data.length === 0) data = await fetchWithRadius(100);

                if (data.length > 0) {
                    setStations(data);
                } else {
                    throw new Error("No stations found even at 100km radius.");
                }
            } catch (err) {
                console.warn("⚠️ No Real Grid Data Found. Activating SIMULATION MODE.", err);
                const mockStations: OCMStation[] = Array.from({ length: 8 }).map((_, i) => ({
                    ID: 9000 + i,
                    AddressInfo: {
                        Title: `Demo Station ${String.fromCharCode(65 + i)} (Simulated)`,
                        Latitude: userLocation[0] + (Math.random() - 0.5) * 0.08,
                        Longitude: userLocation[1] + (Math.random() - 0.5) * 0.08,
                        AddressLine1: "Simulated Grid Location"
                    },
                    Connections: [{ Quantity: Math.floor(Math.random() * 8) + 2 }],
                    NumberOfPoints: Math.floor(Math.random() * 8) + 2
                }));
                // Only set stations if we have mock ones
                if(mockStations.length > 0) setStations(mockStations);
            }
        };

        executeSmartSearch();
    }, [userLocation]);

    // ... (keep helpers)
    const getCapacityScore = (st: OCMStation) => {
        if (st.NumberOfPoints) return st.NumberOfPoints;
        if (st.Connections && st.Connections.length > 0) {
            return st.Connections.reduce((acc, c) => acc + (c.Quantity || 1), 0);
        }
        return 1; 
    };

    const getStationStatus = (capacity: number) => {
        if (capacity >= 10) return 'safe';
        if (capacity >= 4) return 'warning';
        return 'critical';
    };

    const enhancedStations = useMemo(() => {
        return stations.map(st => {
            const capacity = getCapacityScore(st);
            const status = getStationStatus(capacity);
            const load = Math.floor(Math.random() * 100);
            const temp = Math.floor(Math.random() * 60) + 40;
            return {
                ...st,
                capacity,
                status: status as 'safe' | 'warning' | 'critical',
                load,
                temp
            };
        });
    }, [stations]);

    // Calculate total metrics
    const totalStations = stations.length;
    const totalCapacity = enhancedStations.reduce((acc, st) => acc + st.capacity, 0);
    const averageLoad = 65; 
    const criticalStations = enhancedStations.filter(st => st.status === 'critical').length;

    // Default center if user location not yet loaded
    const mapCenter: [number, number] = userLocation || [40.7128, -74.0060];

    return (
        <div className="w-full h-full bg-void flex relative overflow-hidden">
            {/* Sidebar code (kept same, just updating map part deeply) */}
            <div className="absolute left-6 top-6 bottom-6 w-96 flex flex-col z-[500] pointer-events-none">
                <div className="w-full h-full glass-panel-heavy rounded-2xl flex flex-col overflow-hidden pointer-events-auto">
                    <div className="p-6 border-b border-slate-700/30">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-mono font-bold text-white tracking-tight">SENTINEL<span className="text-neon-cyan">.OS</span></h1>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Grid Intelligence Protocol</p>
                            </div>
                            <div className="flex bg-slate-800/50 rounded-lg p-1">
                                <button onClick={() => setViewMode('map')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'map' ? 'bg-neon-cyan text-black shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'text-slate-400 hover:text-white'}`}>MAP</button>
                                <button onClick={() => setViewMode('list')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'list' ? 'bg-neon-cyan text-black shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'text-slate-400 hover:text-white'}`}>LIST</button>
                            </div>
                        </div>
                        
                        <div className="relative group">
                            <div className="absolute inset-0 bg-neon-cyan/20 blur-xl opacity-0 group-hover:opacity-20 transition-opacity rounded-lg"></div>
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-neon-cyan transition-colors" />
                            <input type="text" placeholder="Search grid assets..." className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-neon-cyan/50 focus:bg-slate-900/80 transition-all font-mono text-sm" />
                        </div>

                       <div className="flex items-center gap-3 mt-4">
                            <select className="bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:border-neon-cyan/50 outline-none">
                                <option>Status: All</option>
                                <option>Safe</option>
                                <option>Warning</option>
                                <option>Critical</option>
                            </select>
                            <select className="bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:border-neon-cyan/50 outline-none">
                                <option>Load: Any</option>
                                <option>&lt; 50%</option>
                                <option>&gt; 80%</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-800/20 rounded-xl p-3 border border-slate-700/30">
                                <div className="flex items-center gap-2 mb-1">
                                    <Activity className="w-3 h-3 text-neon-cyan" />
                                    <span className="text-slate-400 text-[10px] uppercase tracking-wider">Active Nodes</span>
                                </div>
                                <div className="text-xl font-mono font-bold text-white">{totalStations}</div>
                            </div>
                            <div className="bg-slate-800/20 rounded-xl p-3 border border-slate-700/30">
                                <div className="flex items-center gap-2 mb-1">
                                    <Zap className="w-3 h-3 text-neon-lime" />
                                    <span className="text-slate-400 text-[10px] uppercase tracking-wider">Grid Cap</span>
                                </div>
                                <div className="text-xl font-mono font-bold text-white">{totalCapacity} <span className="text-xs text-slate-500 font-sans">kW</span></div>
                            </div>
                            <div className="bg-slate-800/20 rounded-xl p-3 border border-slate-700/30">
                                <div className="flex items-center gap-2 mb-1">
                                    <Activity className="w-3 h-3 text-amber-400" />
                                    <span className="text-slate-400 text-[10px] uppercase tracking-wider">Avg Load</span>
                                </div>
                                <div className="text-xl font-mono font-bold text-white">{averageLoad}%</div>
                            </div>
                            <div className="bg-slate-800/20 rounded-xl p-3 border border-slate-700/30 relative overflow-hidden">
                                {criticalStations > 0 && <div className="absolute inset-0 bg-plasma/10 animate-pulse"></div>}
                                <div className="flex items-center gap-2 mb-1 relative z-10">
                                    <AlertTriangle className="w-3 h-3 text-plasma" />
                                    <span className="text-slate-400 text-[10px] uppercase tracking-wider">Critical</span>
                                </div>
                                <div className="text-xl font-mono font-bold text-plasma relative z-10">{criticalStations}</div>
                            </div>
                        </div>
                    </div>

                    <NearbyStationsPanel 
                        stations={enhancedStations}
                        selectedStationId={selectedStationId}
                        onSelectStation={(id, st) => {
                            setSelectedStationId(id);
                            selectStation({
                                id: id,
                                name: st.AddressInfo.Title,
                                lat: st.AddressInfo.Latitude,
                                lng: st.AddressInfo.Longitude,
                                status: st.status,
                                load: st.load,
                                temp: st.temp,
                                address: st.AddressInfo.AddressLine1
                            });
                        }}
                        onNavigate={(lat, lng) => {
                            if (userLocation) setRouteDest([lat, lng]);
                        }}
                    />
                </div>
            </div>

            <div className="flex-1 relative z-0">
                <MapContainer 
                    center={mapCenter} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                    className="z-0 bg-void"
                    zoomControl={false}
                >
                    <MapUpdater center={mapCenter} />
                    
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    />

                    {userLocation && (
                        <CircleMarker 
                            center={userLocation}
                            radius={8}
                            pathOptions={{ color: '#22d3ee', fillColor: '#22d3ee', fillOpacity: 1 }}
                        >
                            <div className="absolute w-[200px] h-[200px] bg-neon-cyan/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                        </CircleMarker>
                    )}

                    {enhancedStations.map(st => (
                        <CustomMapMarker
                            key={st.ID}
                            station={st}
                            isSelected={selectedStationId === st.ID.toString()}
                            onClick={() => {
                                setSelectedStationId(st.ID.toString());
                                selectStation({
                                    id: st.ID.toString(),
                                    name: st.AddressInfo.Title,
                                    lat: st.AddressInfo.Latitude,
                                    lng: st.AddressInfo.Longitude,
                                    status: st.status,
                                    load: st.load,
                                    temp: st.temp,
                                    address: st.AddressInfo.AddressLine1
                                });
                            }}
                            onNavigate={() => {
                                if (userLocation) setRouteDest([st.AddressInfo.Latitude, st.AddressInfo.Longitude]);
                            }}
                        />
                    ))}

                    <RoutingControl userLoc={userLocation} destLoc={routeDest} />
                </MapContainer>
                
                <div className="absolute top-6 right-6 z-[400] glass-panel rounded-full px-5 py-2.5 flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Grid Status</span>
                        <div className="flex items-center gap-2">
                             <span className="text-neon-lime text-xs font-mono">OPTIMAL</span>
                        </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-neon-lime shadow-[0_0_10px_#bef264] animate-pulse" />
                </div>
            </div>
        </div>
    );
}
