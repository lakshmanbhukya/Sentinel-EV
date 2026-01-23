import { DivIcon } from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import { Zap, Navigation } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

interface CustomMarkerProps {
  station: any;
  isSelected: boolean;
  onClick: () => void;
  onNavigate: () => void;
}

export default function CustomMapMarker({ station, isSelected, onClick, onNavigate }: CustomMarkerProps) {
  const status = station.status;
  
  // Create a Custom SVG Pin based on status color
  const getMarkerColor = () => {
    switch (status) {
      case 'critical': return '#ef4444'; // Red
      case 'warning': return '#f59e0b'; // Amber
      default: return '#10b981'; // Emerald
    }
  };

  const markerColor = getMarkerColor();
  const isSelectedClass = isSelected ? 'scale-125 z-50 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'hover:scale-110';

  // SVG for a modern Map Pin with a Charging Bolt
  const iconHtml = renderToStaticMarkup(
    <div className={`relative transition-all duration-200 ${isSelectedClass}`}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-lg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={markerColor} stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="9" r="3" fill="rgba(0,0,0,0.2)" />
            {/* Bolt Icon Center */}
            <path d="M11.5 7L12.5 7L11.5 11L13.5 11L11.5 14L12.5 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> 
        </svg>
        {/* Simple Zap Icon Overlay if critical */}
        {status === 'critical' && (
            <div className="absolute -top-1 -right-1 bg-red-500 border border-white text-white rounded-full p-[2px]">
               <Zap size={8} fill="currentColor" />
            </div>
        )}
    </div>
  );

  const customIcon = new DivIcon({
    html: iconHtml,
    className: 'bg-transparent',
    iconSize: [40, 40],
    iconAnchor: [20, 40], // Anchor at bottom tip
    popupAnchor: [0, -36]
  });

  return (
    <Marker 
      position={[station.AddressInfo.Latitude, station.AddressInfo.Longitude]} 
      icon={customIcon}
      eventHandlers={{ click: onClick }}
    >
        <Popup className="glass-popup">
            <div className="p-3 bg-void/90 backdrop-blur-md rounded-lg border border-slate-700 min-w-[200px] text-white">
                <h3 className="font-mono font-bold text-lg mb-1">{station.AddressInfo.Title}</h3>
                <div className="text-xs text-slate-400 mb-3 font-sans opacity-80">{station.AddressInfo.AddressLine1}</div>
                <div className="flex items-center gap-2 mb-3">
                    <Zap className={status === 'critical' ? "w-4 h-4 text-plasma" : "w-4 h-4 text-neon-cyan"} />
                    <span className="font-mono text-sm">Capacity: <span className="text-white">{station.capacity}</span></span>
                </div>
                
                <button 
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-md px-3 py-2 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/25"
                    onClick={(e) => {
                        e.stopPropagation();
                        onNavigate();
                    }}
                >
                    <Navigation className="w-3 h-3" />
                    NAVIGATE NOW
                </button>
            </div>
        </Popup>
    </Marker>
  );
}
