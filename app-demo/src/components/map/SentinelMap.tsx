import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { useDemoStore } from '../../store/useDemoStore';
import NearbyStationsPanel from '../ui/NearbyStationsPanel';
import CustomMapMarker from './CustomMapMarker';
import CitySelector, { INDIAN_CITIES, type City } from '../ui/CitySelector';
import { useStationsData } from '../../hooks/useStationsData'; // NEW IMPORT
import type { Station } from '../../data/mockData'; // Standard Interface

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

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
    const [selectedCity, setSelectedCity] = useState<City | null>(INDIAN_CITIES[6]); // Default to Bengaluru
    
    // 1. Get User Location (Use selected city or default to Bangalore)
    useEffect(() => {
        if (selectedCity) {
            setUserLocation([selectedCity.lat, selectedCity.lng]);
        } else {
            setUserLocation([12.9716, 77.5946]); // Default Bangalore
        }
    }, [selectedCity]);

    const [routeDest, setRouteDest] = useState<[number, number] | null>(null);
    const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

    // 2. Use Data Hook (Replaces previous useEffect fetch logic)
    const { stations: dataStations, isMock, isLoading } = useStationsData(
        userLocation?.[0] || 12.9716, 
        userLocation?.[1] || 77.5946, 
        50 // Increased radius to get more stations
    );

    // Log when stations change
    useEffect(() => {
        console.log(`📊 Stations updated: ${dataStations.length} stations loaded (${isMock ? 'MOCK' : 'REAL'} data)`);
    }, [dataStations.length, isMock]);

    // 3. Process Stations (Assign capacity score if needed, though useStationsData might not provide it yet)
    // We can keep the logic to "Enhance" them or just assume the Hook does enough.
    // The previous code calculated capacity based on Connections.
    // Our new Station interface from Transformer doesn't strictly have connections detailed unless we added it.
    // transformStation maps mostly basic fields. 
    // We'll augment them locally for visual richness if needed.
    const stations: Station[] = useMemo(() => {
         return dataStations.map(st => ({
             ...st,
             // Ensure optional fields if missing
             capacity: (st as any).capacity || Math.floor(Math.random() * 8) + 2
         }));
    }, [dataStations]);


    // Calculate total metrics
    const totalStations = stations.length;
    const totalCapacity = stations.reduce((acc, st) => acc + ((st as any).capacity || 0), 0);
    const averageLoad = 65; 
    const criticalStations = stations.filter(st => st.status === 'critical').length;

    // Default center if user location not yet loaded
    const mapCenter: [number, number] = userLocation || [40.7128, -74.0060];

    return (
        <div className="w-full h-full bg-void flex relative overflow-hidden">
            {/* Sidebar code (kept same, just updating map part deeply) */}
            <div className="absolute left-6 top-6 bottom-6 w-96 flex flex-col z-[500] pointer-events-none">
                <div className="w-full h-full glass-panel-heavy rounded-2xl flex flex-col overflow-hidden pointer-events-auto">
                    <div className="p-6 border-b border-slate-700/30">
                        <div className="mb-6">
                            <div>
                                <h1 className="text-2xl font-mono font-bold text-white tracking-tight">SENTINEL<span className="text-neon-cyan">.EV</span></h1>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Grid Intelligence Protocol</p>
                            </div>
                        </div>

                        {/* City Selector */}
                        <div className="mb-4">
                            <CitySelector
                                selectedCity={selectedCity}
                                onCityChange={(city) => {
                                    console.log(`🌆 City changed to: ${city.name}`);
                                    setSelectedCity(city);
                                }}
                            />
                        </div>
                        
                        {/* Status Indicator */}
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                {isLoading ? (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        <span className="text-[10px] text-amber-400 uppercase tracking-wider">
                                            Loading Stations...
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                            {isMock ? "Simulation Mode" : "Grid Connected"}
                                        </span>
                                    </>
                                )}
                             </div>
                        </div>
                    </div>
                    <NearbyStationsPanel 
                        stations={stations}
                        selectedStationId={selectedStationId}
                        onSelectStation={(id, st) => {
                            setSelectedStationId(id);
                            // Store already expects Station interface, so no mapping needed anymore!
                            selectStation(st);
                        }}
                        onNavigate={(lat, lng) => {
                            if (userLocation) setRouteDest([lat, lng]);
                        }}
                        enableCitySelector={false}
                    />
                </div>
            </div>

            <div className="flex-1 relative z-0">
                <MapContainer 
                    key={`map-${selectedCity?.name || 'default'}`} // Force re-render on city change
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

                    {stations.map(st => (
                        <CustomMapMarker
                            key={st.id}
                            station={st}
                            isSelected={selectedStationId === st.id}
                            onClick={() => {
                                setSelectedStationId(st.id);
                                selectStation(st);
                            }}
                            onNavigate={() => {
                                if (userLocation) setRouteDest([st.lat, st.lng]);
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
