import { MapPin, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { CITIES, type CityData } from '../../data/cityStationsData';

// Export for backward compatibility
export const INDIAN_CITIES = CITIES;
export type City = CityData;

interface CitySelectorProps {
  selectedCity: string | null | CityData;
  onCitySelect?: (city: CityData) => void;
  onCityChange?: (city: CityData) => void; // Backward compatibility
}

export default function CitySelector({ selectedCity, onCitySelect, onCityChange }: CitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCityClick = (city: CityData) => {
    // Support both callback names
    if (onCitySelect) onCitySelect(city);
    if (onCityChange) onCityChange(city);
    setIsOpen(false);
  };

  // Handle both string and CityData types for selectedCity
  const selectedCityName = typeof selectedCity === 'string' ? selectedCity : selectedCity?.name || null;
  const selectedCityData = CITIES.find(c => c.name === selectedCityName);

  return (
    <div className="relative px-6 pt-6 pb-4">
      <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Select City</div>
      
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg px-4 py-3 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-400" />
          <span className="text-white font-medium">
            {selectedCityData ? selectedCityData.name : 'Choose a city...'}
          </span>
          {selectedCityData && (
            <span className="text-xs text-slate-400">
              ({selectedCityData.stationCount} stations)
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full left-6 right-6 mt-2 bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto">
            {CITIES.map((city) => (
              <button
                key={city.name}
                onClick={() => handleCityClick(city)}
                className={`w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors border-b border-slate-700/30 last:border-b-0 ${
                  selectedCityName === city.name ? 'bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin className={`w-4 h-4 ${selectedCityName === city.name ? 'text-blue-400' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <div className={`font-medium ${selectedCityName === city.name ? 'text-blue-400' : 'text-white'}`}>
                      {city.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {city.stationCount} EV stations
                    </div>
                  </div>
                </div>
                {selectedCityName === city.name && (
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
