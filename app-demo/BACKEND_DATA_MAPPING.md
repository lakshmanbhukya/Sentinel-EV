# Backend Data Mapping Specification

This document outlines all the visual data points currently implemented as mock data in the Transformer Sentinel Protocol frontend. This serves as a comprehensive specification for backend API development and data integration.

## Overview

The frontend currently uses mock data to simulate a real-time electrical grid monitoring system. All data points listed below need to be replaced with actual backend API calls and real-time data streams.

---

## 1. Core Station Data Structure

### Station Entity
**File**: `app-demo/src/data/mockData.ts`

```typescript
interface Station {
  id: string;           // Unique station identifier
  name: string;         // Human-readable station name
  lat: number;          // Latitude coordinate
  lng: number;          // Longitude coordinate
  status: 'safe' | 'warning' | 'critical';  // Operational status
  load: number;         // Current load percentage (0-100%)
  temp: number;         // Temperature in Celsius
  address: string;      // Physical address
}
```

**Current Mock Data**: 5 stations in New York area
**Backend Requirements**:
- Real-time station status updates
- Geographic coordinates for map visualization
- Temperature and load monitoring
- Status classification based on operational thresholds

---

## 2. Grid Statistics

### Grid-Wide Metrics
**File**: `app-demo/src/data/mockData.ts`

```typescript
interface GridStats {
  totalLoad: string;      // Total grid load (e.g., "842 MW")
  gridStress: string;     // Overall grid status
  activeAlerts: number;   // Number of active alerts
  efficiency: string;     // Grid efficiency percentage
}
```

**Current Mock Values**:
- Total Load: "842 MW"
- Grid Stress: "CRITICAL"
- Active Alerts: 3
- Efficiency: "68%"

**Backend Requirements**:
- Real-time aggregated load calculations
- Grid stress level determination algorithms
- Alert counting and categorization
- Efficiency metrics calculation

---

## 3. Map Interface Data

### Enhanced Station Data
**File**: `app-demo/src/components/map/SentinelMap.tsx`

The map interface enhances basic station data with additional calculated metrics:

```typescript
interface EnhancedStation extends Station {
  capacity: number;     // Station capacity score
  status: 'safe' | 'warning' | 'critical';
  load: number;         // Real-time load percentage
  temp: number;         // Real-time temperature
}
```

### Map Metrics Dashboard
**Current Mock Calculations**:
- **Total Stations**: Count of all stations
- **Total Capacity**: Sum of all station capacities
- **Average Load**: Average load across all stations (currently mock: 65%)
- **Critical Stations**: Count of stations with 'critical' status

**Backend Requirements**:
- Real-time station counting
- Capacity aggregation algorithms
- Load averaging calculations
- Status-based filtering and counting

---

## 4. EV Energy Twin Sidebar Data

### Real-Time Telemetry
**File**: `app-demo/src/components/twin/EVStationSidebar.tsx`

```typescript
interface EVEnergyData {
  time: string;         // Timestamp
  temp: number;         // Temperature reading
  limit: number;        // Temperature limit (110°C)
}
```

**Current Mock Generation**: 20 data points with 15-minute intervals
**Backend Requirements**:
- Historical temperature data
- Real-time temperature streaming
- Configurable time intervals
- Temperature limit thresholds

### Asset Information
**Current Mock Data**:
- Asset ID: "TX-2049-NYC"
- Rating: "2500 kVA"

**Backend Requirements**:
- Asset registry integration
- Equipment specifications database
- Asset identification system

---

## 5. Analytics Data Structures

### Monthly Usage Heatmap
**File**: `app-demo/src/data/mockAnalyticsData.ts`

```typescript
interface HeatmapDataPoint {
  day: string;          // Day of week (Mon, Tue, etc.)
  hour: number;         // Hour of day (0-23)
  value: number;        // Usage intensity (0-100)
}
```

**Current Mock Logic**:
- High usage during rush hours (8-10 AM, 5-7 PM)
- Normal usage during business hours
- Low usage during night hours
- Weekend variance (20% reduction)

**Backend Requirements**:
- Historical usage data aggregation
- Time-based usage pattern analysis
- Day-of-week and hour-of-day breakdowns
- Usage intensity calculations

### Demand Prediction
```typescript
interface DemandPredictionPoint {
  time: string;         // Time label
  actual?: number;      // Historical actual values
  predicted?: number;   // Predicted future values
  lowerBound?: number;  // Prediction confidence lower bound
  upperBound?: number;  // Prediction confidence upper bound
}
```

**Current Mock Logic**:
- Past 12 hours: actual values (40-80 range)
- Future 12 hours: predicted values with confidence bounds
- Slight upward trend in predictions

**Backend Requirements**:
- Machine learning prediction models
- Historical data for training
- Confidence interval calculations
- Real-time prediction updates

### Operational Metrics
```typescript
interface OperationalMetrics {
  optimalHours: string[];   // Best charging times
  energyDelivered: number;  // Total kWh delivered
  utilizationRate: number;  // Utilization percentage
  peakHours: string;        // Peak usage period
  quietHours: string;       // Low usage period
  carbonSaved: number;      // Environmental impact (kg CO2)
}
```

**Current Mock Ranges**:
- Energy Delivered: 1000-1500 kWh
- Utilization Rate: 50-80%
- Carbon Saved: 200-300 kg

**Backend Requirements**:
- Energy delivery tracking
- Utilization rate calculations
- Peak/quiet hour analysis
- Carbon footprint calculations

---

## 6. Booking System Data

### Booking Status Flow
**File**: `app-demo/src/store/useDemoStore.ts`

```typescript
type BookingStatus = 'idle' | 'analyzing' | 'conflict' | 'optimized' | 'confirmed';
```

**Current Mock Logic**:
- Analyzing: 1.5 second delay simulation
- Conflict: Triggered when station status is 'critical'
- Optimization: 1 second analysis + 0.8 second optimization
- Confirmation: Final booking state

**Backend Requirements**:
- Real-time grid impact analysis
- EV energy physics simulation
- Optimization algorithms
- Booking confirmation system

---

## 7. External API Integration

### OpenChargeMap (OCM) Integration
**File**: `app-demo/src/components/map/SentinelMap.tsx`

**Current Implementation**:
- API Key: `VITE_OCM_API_KEY`
- Radius-based search: 5km → 25km → 100km
- Fallback to simulation mode if API fails

```typescript
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
```

**Backend Requirements**:
- OCM API integration
- Data transformation and normalization
- Caching strategies
- Fallback data sources

---

## 8. Real-Time Data Requirements

### WebSocket/SSE Streams Needed

1. **Station Status Updates**
   - Temperature changes
   - Load fluctuations
   - Status transitions
   - Alert notifications

2. **Grid Metrics Updates**
   - Total load changes
   - Grid stress level updates
   - New alerts
   - Efficiency calculations

3. **EV Energy Data Streams**
   - Real-time temperature readings
   - Equipment status changes
   - Threshold violations

### Update Frequencies

- **Critical Data**: Every 5-10 seconds
  - Temperature readings
  - Load percentages
  - Status changes

- **Standard Data**: Every 30-60 seconds
  - Grid statistics
  - Aggregated metrics
  - Non-critical updates

- **Analytics Data**: Every 5-15 minutes
  - Usage patterns
  - Demand predictions
  - Operational metrics

---

## 9. API Endpoint Specifications

### Suggested REST API Structure

```
GET /api/stations                    # List all stations
GET /api/stations/:id                # Get specific station
GET /api/stations/:id/telemetry      # Real-time station data
GET /api/stations/:id/analytics      # Station analytics
GET /api/grid/status                 # Grid-wide statistics
GET /api/grid/alerts                 # Active alerts
POST /api/bookings                   # Create booking
GET /api/bookings/:id/status         # Booking status
```

### WebSocket Events

```
station:update          # Station data changed
grid:status            # Grid status changed
ev_energy:reading        # New temperature reading
alert:new              # New alert created
alert:resolved         # Alert resolved
booking:status         # Booking status changed
```

---

## 10. Data Validation & Constraints

### Temperature Limits
- **Warning Threshold**: 85°C
- **Critical Threshold**: 110°C
- **Safe Range**: 40-84°C

### Load Limits
- **Safe Range**: 0-70%
- **Warning Range**: 71-90%
- **Critical Range**: 91-100%

### Status Classification Logic
```typescript
function getStationStatus(temp: number, load: number): StationStatus {
  if (temp >= 110 || load >= 91) return 'critical';
  if (temp >= 85 || load >= 71) return 'warning';
  return 'safe';
}
```

---

## 11. Implementation Priority

### Phase 1: Core Data (High Priority)
- Station basic data (location, status, temp, load)
- Grid statistics
- Real-time updates

### Phase 2: Analytics (Medium Priority)
- Usage heatmaps
- Demand predictions
- Operational metrics

### Phase 3: Advanced Features (Low Priority)
- Booking system integration
- Optimization algorithms
- Advanced analytics

---

## 12. Testing & Validation

### Mock Data Preservation
- Keep existing mock data generators for development
- Implement feature flags for mock vs. real data
- Maintain data structure compatibility

### Performance Requirements
- API response times < 200ms
- WebSocket latency < 100ms
- Map rendering with 100+ stations
- Real-time updates without UI blocking

---

This specification provides a complete mapping of all visual data points currently implemented as mock data. Use this document as a reference for backend API development and ensure all data structures and update frequencies align with the frontend requirements.