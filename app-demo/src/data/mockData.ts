export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'safe' | 'warning' | 'critical';
  load: number; // 0-100%
  temp: number; // Celsius
  address: string;
}

export const STATIONS: Station[] = [
  {
    id: 'st-1',
    name: 'Downtown Core Substation',
    lat: 40.7128,
    lng: -74.0060,
    status: 'critical',
    load: 92,
    temp: 108, // Near breakdown
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
    address: '100 Spring St, New York, NY'
  },
  {
    id: 'st-5',
    name: 'Tribeca Terminal',
    lat: 40.7163,
    lng: -74.0086,
    status: 'critical',
    load: 95,
    temp: 112, // OVERHEATING
    address: '50 Hudson St, New York, NY'
  }
];

export const GRID_STATS = {
    totalLoad: '842 MW',
    gridStress: 'CRITICAL',
    activeAlerts: 3,
    efficiency: '68%'
};
