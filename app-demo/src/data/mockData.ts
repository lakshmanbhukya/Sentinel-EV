export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'safe' | 'warning' | 'critical';
  load: number; // 0-100%
  temp: number; // Celsius
  address: string;
  totalChargers?: number;
  availableChargers?: number;
}

export const STATIONS: Station[] = [
  // Bangalore Stations (for Demo)
  {
    id: 'st-blr-1',
    name: 'Tech Park Charger',
    lat: 12.9716,
    lng: 77.5946,
    status: 'safe',
    load: 45,
    temp: 55,
    address: 'Vittal Mallya Rd, Bangalore'
  },
  {
    id: 'st-blr-2',
    name: 'Indiranagar Fast Charge',
    lat: 12.9784,
    lng: 77.6408,
    status: 'warning',
    load: 78,
    temp: 82,
    address: '100 Feet Rd, Indiranagar'
  },
  {
    id: 'st-blr-3',
    name: 'Koramangala Hub',
    lat: 12.9352,
    lng: 77.6245,
    status: 'critical',
    load: 94,
    temp: 105,
    address: '80 Feet Rd, Koramangala'
  },
  {
    id: 'st-blr-4',
    name: 'MG Road Central',
    lat: 12.9750,
    lng: 77.6100,
    status: 'safe',
    load: 25,
    temp: 45,
    address: 'MG Road, Bangalore'
  },
  {
    id: 'st-blr-5',
    name: 'Jayanagar Eco Station',
    lat: 12.9250,
    lng: 77.5938,
    status: 'safe',
    load: 60,
    temp: 68,
    address: '4th Block, Jayanagar'
  },
  {
    id: 'st-blr-6',
    name: 'Whitefield Tech Hub',
    lat: 12.9698,
    lng: 77.7500,
    status: 'warning',
    load: 85,
    temp: 88,
    address: 'ITPL Main Rd, Whitefield'
  },
  {
    id: 'st-blr-7',
    name: 'Electronic City Plaza',
    lat: 12.8456,
    lng: 77.6603,
    status: 'safe',
    load: 42,
    temp: 52,
    address: 'Electronic City Phase 1'
  },
  {
    id: 'st-blr-8',
    name: 'HSR Layout Junction',
    lat: 12.9081,
    lng: 77.6476,
    status: 'critical',
    load: 96,
    temp: 110,
    address: '27th Main Rd, HSR Layout'
  },
  {
    id: 'st-blr-9',
    name: 'Marathahalli Bridge',
    lat: 12.9591,
    lng: 77.6974,
    status: 'safe',
    load: 38,
    temp: 48,
    address: 'Marathahalli Bridge, Bangalore'
  },
  {
    id: 'st-blr-10',
    name: 'Banashankari Terminal',
    lat: 12.9250,
    lng: 77.5500,
    status: 'warning',
    load: 72,
    temp: 79,
    address: 'Banashankari 2nd Stage'
  },
  {
    id: 'st-blr-11',
    name: 'Rajajinagar Metro',
    lat: 12.9915,
    lng: 77.5560,
    status: 'safe',
    load: 55,
    temp: 62,
    address: 'Rajajinagar Metro Station'
  },
  {
    id: 'st-blr-12',
    name: 'Hebbal Flyover',
    lat: 13.0358,
    lng: 77.5970,
    status: 'critical',
    load: 91,
    temp: 102,
    address: 'Hebbal Flyover, Bangalore'
  },
  // NY Stations (Legacy/Fallback)
  {
    id: 'st-1',
    name: 'Downtown Core Substation',
    lat: 40.7128,
    lng: -74.0060,
    status: 'critical',
    load: 92,
    temp: 108, 
    address: '128 Broadway, New York, NY'
  },
  {
    id: 'st-2',
    name: 'East River Hub',
    lat: 40.7282,
    lng: -73.9942,
    status: 'safe',
    load: 45,
    temp: 65,
    address: '450 Lafayette St, New York, NY'
  },
  {
    id: 'st-3',
    name: 'West Village Node',
    lat: 40.7359,
    lng: -74.0031,
    status: 'warning',
    load: 78,
    temp: 85,
    address: '280 W 12th St, New York, NY'
  },
  {
    id: 'st-4',
    name: 'SoHo Junction',
    lat: 40.7233,
    lng: -74.0030,
    status: 'safe',
    load: 30,
    temp: 55, 
    address: '100 Spring St, New York, NY',
    totalChargers: 8,
    availableChargers: 6
  },
  {
    id: 'st-5',
    name: 'Tribeca Terminal',
    lat: 40.7163,
    lng: -74.0086,
    status: 'critical',
    load: 95,
    temp: 112, 
    address: '50 Hudson St, New York, NY',
    totalChargers: 12,
    availableChargers: 0
  }
];

export const GRID_STATS = {
    totalLoad: '1247 MW',
    gridStress: 'CRITICAL',
    activeAlerts: 5,
    efficiency: '72%'
};
