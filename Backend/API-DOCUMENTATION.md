# EV Charging Backend - Complete API Documentation

## Base URL
```
http://localhost:3000/api
```

## Response Format
All API responses follow this consistent format:
```json
{
  "success": true/false,
  "message": "Optional message",
  "data": {},
  "error": "Error message if success=false"
}
```

---

## 1. Power Logging APIs

### 1.1 Log Power Usage
Store power usage data for demand analytics.

**Endpoint:** `POST /api/power/log`

**Request Body:**
```json
{
  "stationId": 5,
  "powerKW": 88.5,
  "activePorts": 4,
  "region": "Bangalore"
}
```

**Required Fields:**
- `stationId` (Number) - Station identifier
- `powerKW` (Number) - Power consumption in kilowatts
- `region` (String) - Geographic region

**Optional Fields:**
- `activePorts` (Number) - Number of active charging ports (default: 0)

**Success Response (201):**
```json
{
  "success": true,
  "message": "Power usage logged successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "stationId": 5,
    "powerKW": 88.5,
    "activePorts": 4,
    "region": "Bangalore",
    "timestamp": "2026-01-24T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "stationId, powerKW, and region are required"
}
```

---

## 2. Analytics APIs (Core Challenge 1)

### 2.1 Get Hourly Demand Pattern
Analyze average power consumption by hour of day.

**Endpoint:** `GET /api/analytics/hourly`

**Query Parameters:**
- `stationId` (required) - Station identifier

**Example Request:**
```
GET /api/analytics/hourly?stationId=5
```

**Success Response (200):**
```json
{
  "success": true,
  "stationId": 5,
  "data": [
    { "hour": 0, "avgPower": 45.2 },
    { "hour": 1, "avgPower": 38.7 },
    { "hour": 6, "avgPower": 62.3 },
    { "hour": 18, "avgPower": 92.4 },
    { "hour": 19, "avgPower": 101.2 }
  ]
}
```

### 2.2 Get Peak Hours
Identify top 3 busiest hours based on historical data.

**Endpoint:** `GET /api/analytics/peak`

**Query Parameters:**
- `stationId` (required) - Station identifier

**Example Request:**
```
GET /api/analytics/peak?stationId=5
```

**Success Response (200):**
```json
{
  "success": true,
  "stationId": 5,
  "peakHours": [18, 19, 20]
}
```

### 2.3 Get Regional Demand Trend
Analyze daily total power consumption by region.

**Endpoint:** `GET /api/analytics/region`

**Query Parameters:**
- `region` (required) - Geographic region name

**Example Request:**
```
GET /api/analytics/region?region=Bangalore
```

**Success Response (200):**
```json
{
  "success": true,
  "region": "Bangalore",
  "data": [
    { "date": "2026-01-20", "totalPower": 560.5 },
    { "date": "2026-01-21", "totalPower": 610.2 },
    { "date": "2026-01-22", "totalPower": 595.8 }
  ]
}
```

---

## 3. ML Prediction APIs (Core Challenge 2)

### 3.1 Predict Power Usage
Get ML-based power prediction for specific hour.

**Endpoint:** `POST /api/ml/predict`

**Request Body:**
```json
{
  "stationId": 5,
  "hour": 18,
  "day_num": 2
}
```

**Required Fields:**
- `stationId` (Number) - Station identifier
- `hour` (Number) - Hour of day (0-23)
- `day_num` (Number) - Day of week (0=Sunday, 6=Saturday)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "predicted_powerKW": 96.5
  }
}
```

### 3.2 Forecast Peak Hours
Predict top 5 peak hours for next 24 hours using ML.

**Endpoint:** `GET /api/forecast/peak`

**Query Parameters:**
- `stationId` (required) - Station identifier

**Example Request:**
```
GET /api/forecast/peak?stationId=5
```

**Success Response (200):**
```json
{
  "success": true,
  "stationId": 5,
  "predictedPeakHours": [
    { "hour": 18, "predicted_powerKW": 110.2 },
    { "hour": 19, "predicted_powerKW": 105.6 },
    { "hour": 20, "predicted_powerKW": 98.3 },
    { "hour": 17, "predicted_powerKW": 95.1 },
    { "hour": 21, "predicted_powerKW": 89.7 }
  ]
}
```

---

## 4. Scheduling APIs (Core Challenge 3)

### 4.1 Request Smart Charging Schedule
Schedule EV charging with ML-based optimization.

**Endpoint:** `POST /api/schedule/request`

**Request Body:**
```json
{
  "vehicleId": "EV101",
  "stationId": 5,
  "requiredKwh": 20,
  "deadline": "2026-01-24T21:00:00Z",
  "batteryLevel": 30,
  "priority": false
}
```

**Required Fields:**
- `vehicleId` (String) - Vehicle identifier
- `stationId` (Number) - Station identifier
- `requiredKwh` (Number) - Energy required in kWh
- `deadline` (ISO Date) - Must complete by this time
- `batteryLevel` (Number) - Current battery percentage (0-100)

**Optional Fields:**
- `priority` (Boolean) - Priority flag (default: false)

**Success Response (201):**
```json
{
  "success": true,
  "message": "Charging session scheduled successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "vehicleId": "EV101",
    "stationId": 5,
    "requiredKwh": 20,
    "deadline": "2026-01-24T21:00:00.000Z",
    "batteryLevel": 30,
    "priority": false,
    "scheduledStart": "2026-01-24T19:30:00.000Z",
    "chargingRate": "slow",
    "status": "scheduled",
    "reason": "peak_hour_avoided",
    "requestTime": "2026-01-24T10:30:00.000Z"
  }
}
```

**Priority Override Logic:**
- If `batteryLevel < 20%` OR `priority = true` → immediate scheduling

**Charging Rate Logic:**
- `fast` = 50kW (assigned during low load periods)
- `slow` = 25kW (assigned during high load periods)

### 4.2 Get Station Schedule
View all scheduled sessions for a station.

**Endpoint:** `GET /api/schedule/station/:stationId`

**Path Parameters:**
- `stationId` - Station identifier

**Query Parameters (Optional):**
- `startDate` - Filter from date (ISO format)
- `endDate` - Filter to date (ISO format)

**Example Request:**
```
GET /api/schedule/station/5?startDate=2026-01-24T00:00:00Z&endDate=2026-01-25T00:00:00Z
```

**Success Response (200):**
```json
{
  "success": true,
  "stationId": 5,
  "totalSessions": 12,
  "sessions": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "vehicleId": "EV101",
      "scheduledStart": "2026-01-24T19:30:00.000Z",
      "chargingRate": "slow",
      "status": "scheduled"
    }
  ]
}
```

### 4.3 Get Vehicle Schedule
View all scheduled sessions for a vehicle.

**Endpoint:** `GET /api/schedule/vehicle/:vehicleId`

**Path Parameters:**
- `vehicleId` - Vehicle identifier

**Example Request:**
```
GET /api/schedule/vehicle/EV101
```

**Success Response (200):**
```json
{
  "success": true,
  "vehicleId": "EV101",
  "totalSessions": 3,
  "sessions": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "stationId": 5,
      "scheduledStart": "2026-01-24T19:30:00.000Z",
      "deadline": "2026-01-24T21:00:00.000Z",
      "status": "scheduled"
    }
  ]
}
```

### 4.4 Get Station Load Distribution
View hourly load distribution for capacity planning.

**Endpoint:** `GET /api/schedule/load/:stationId`

**Path Parameters:**
- `stationId` - Station identifier

**Query Parameters (Optional):**
- `hours` - Number of hours to forecast (default: 24)

**Example Request:**
```
GET /api/schedule/load/5?hours=12
```

**Success Response (200):**
```json
{
  "success": true,
  "stationId": 5,
  "distribution": [
    { "hour": "2026-01-24T19:00:00.000Z", "sessionCount": 3, "totalPowerKW": 125 },
    { "hour": "2026-01-24T20:00:00.000Z", "sessionCount": 5, "totalPowerKW": 200 }
  ]
}
```

### 4.5 Update Session Status
Update the status of a charging session.

**Endpoint:** `PUT /api/schedule/session/:sessionId/status`

**Path Parameters:**
- `sessionId` - Session identifier

**Request Body:**
```json
{
  "status": "charging"
}
```

**Valid Status Values:**
- `scheduled` - Session is scheduled
- `charging` - Currently charging
- `waiting` - Waiting to start
- `completed` - Charging completed
- `cancelled` - Session cancelled

**Success Response (200):**
```json
{
  "success": true,
  "message": "Session status updated",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "vehicleId": "EV101",
    "status": "charging"
  }
}
```

### 4.6 Cancel Session
Cancel a scheduled charging session.

**Endpoint:** `DELETE /api/schedule/session/:sessionId`

**Path Parameters:**
- `sessionId` - Session identifier

**Example Request:**
```
DELETE /api/schedule/session/65a1b2c3d4e5f6g7h8i9j0k1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Session cancelled successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "status": "cancelled"
  }
}
```

---

## 5. Balanced Scheduling APIs (Core Challenge 4)

### 5.1 Request Balanced Schedule
Schedule charging with grid constraints and user convenience.

**Endpoint:** `POST /api/schedule/balanced`

**Request Body:**
```json
{
  "vehicleId": "EV201",
  "stationId": 5,
  "requiredKwh": 25,
  "deadline": "2026-01-24T22:00:00Z",
  "maxDelayMinutes": 45,
  "batteryLevel": 35,
  "priority": false,
  "region": "Bangalore"
}
```

**Required Fields:**
- `vehicleId` (String) - Vehicle identifier
- `stationId` (Number) - Station identifier
- `requiredKwh` (Number) - Energy required in kWh
- `deadline` (ISO Date) - Must complete by this time
- `batteryLevel` (Number) - Current battery percentage (0-100)
- `region` (String) - Geographic region for grid constraints

**Optional Fields:**
- `maxDelayMinutes` (Number) - Maximum acceptable delay (default: 60)
- `priority` (Boolean) - Priority flag (default: false)

**Success Response (201):**
```json
{
  "success": true,
  "message": "Charging session scheduled with grid balancing",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "vehicleId": "EV201",
    "stationId": 5,
    "region": "Bangalore",
    "requiredKwh": 25,
    "deadline": "2026-01-24T22:00:00.000Z",
    "maxDelayMinutes": 45,
    "batteryLevel": 35,
    "priority": false,
    "scheduledStart": "2026-01-24T20:15:00.000Z",
    "chargingRate": "slow",
    "status": "scheduled",
    "gridSafe": true,
    "actualDelayMinutes": 20,
    "reason": "shifted_to_off_peak",
    "requestTime": "2026-01-24T10:30:00.000Z"
  }
}
```

**Balancing Logic:**
1. Forecast demand using ML for next 24 hours
2. Check grid constraint: `predictedLoad + currentGridLoad ≤ maxSafeLoad × 0.9`
3. Respect user convenience: delay within `maxDelayMinutes` and before `deadline`
4. Priority override: `batteryLevel < 20%` OR `priority = true` → immediate
5. Dynamic charging rate based on grid load percentage

**Grid Safety Margin:** 90% of maxSafeLoadKW

---

## 6. Grid Management APIs

### 6.1 Update Grid Status
Update current grid load and capacity for a region.

**Endpoint:** `POST /api/grid/update`

**Request Body:**
```json
{
  "region": "Bangalore",
  "currentLoadKW": 420,
  "maxSafeLoadKW": 500
}
```

**Required Fields:**
- `region` (String) - Geographic region
- `currentLoadKW` (Number) - Current grid load in kW
- `maxSafeLoadKW` (Number) - Maximum safe load capacity in kW

**Success Response (200):**
```json
{
  "success": true,
  "message": "Grid status updated successfully",
  "data": {
    "region": "Bangalore",
    "currentLoadKW": 420,
    "maxSafeLoadKW": 500,
    "loadPercentage": "84.0%",
    "status": "high",
    "updatedAt": "2026-01-24T10:30:00.000Z"
  }
}
```

**Status Levels:**
- `normal` - Load ≤ 50%
- `moderate` - Load 50-75%
- `high` - Load 75-90%
- `critical` - Load > 90%

### 6.2 Get Grid Status by Region
Retrieve current grid status for a specific region.

**Endpoint:** `GET /api/grid/status/:region`

**Path Parameters:**
- `region` - Geographic region name

**Example Request:**
```
GET /api/grid/status/Bangalore
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "region": "Bangalore",
    "currentLoadKW": 420,
    "maxSafeLoadKW": 500,
    "availableCapacityKW": 80,
    "loadPercentage": "84.0%",
    "status": "high",
    "updatedAt": "2026-01-24T10:30:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Grid status not found for region"
}
```

### 6.3 Get All Grid Statuses
Retrieve grid status for all regions.

**Endpoint:** `GET /api/grid/all`

**Example Request:**
```
GET /api/grid/all
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "region": "Bangalore",
      "currentLoadKW": 420,
      "maxSafeLoadKW": 500,
      "loadPercentage": "84.0%",
      "status": "high",
      "updatedAt": "2026-01-24T10:30:00.000Z"
    },
    {
      "region": "Mumbai",
      "currentLoadKW": 380,
      "maxSafeLoadKW": 600,
      "loadPercentage": "63.3%",
      "status": "moderate",
      "updatedAt": "2026-01-24T10:25:00.000Z"
    }
  ]
}
```

---

## 7. Station APIs (OpenCharge Integration)

### 7.1 Get Nearby Stations
Find charging stations near a location.

**Endpoint:** `GET /api/stations/nearby`

**Query Parameters:**
- `lat` (required) - Latitude
- `lng` (required) - Longitude
- `radius` (optional) - Search radius in km (default: 10)
- `maxResults` (optional) - Maximum results (default: 50)

**Example Request:**
```
GET /api/stations/nearby?lat=12.9716&lng=77.5946&radius=5&maxResults=20
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 15,
  "searchParams": {
    "lat": 12.9716,
    "lng": 77.5946,
    "radius": 5
  },
  "data": [
    {
      "id": 12345,
      "name": "MG Road Charging Hub",
      "addressLine1": "123 MG Road",
      "town": "Bangalore",
      "stateOrProvince": "Karnataka",
      "postcode": "560001",
      "country": "India",
      "latitude": 12.9750,
      "longitude": 77.6088,
      "distance": 1.2,
      "numberOfPoints": 8,
      "usageType": "Public",
      "statusType": "Operational",
      "connections": [
        {
          "connectionType": "Type 2",
          "powerKW": 50,
          "currentType": "AC",
          "quantity": 4
        }
      ]
    }
  ]
}
```

### 7.2 Get Stations by City
Find charging stations in a specific city.

**Endpoint:** `GET /api/stations/city/:cityName`

**Path Parameters:**
- `cityName` - City name (e.g., "Bangalore", "Mumbai", "Delhi")

**Query Parameters (Optional):**
- `maxResults` - Maximum results (default: 50)

**Example Request:**
```
GET /api/stations/city/Bangalore?maxResults=30
```

**Supported Cities:**
- Bangalore
- Mumbai
- Delhi
- Hyderabad
- Chennai
- Pune
- Kolkata
- Ahmedabad
- Jaipur

**Success Response (200):**
```json
{
  "success": true,
  "city": "Bangalore",
  "count": 25,
  "data": [
    {
      "id": 12345,
      "name": "MG Road Charging Hub",
      "addressLine1": "123 MG Road",
      "town": "Bangalore",
      "numberOfPoints": 8,
      "usageType": "Public",
      "statusType": "Operational"
    }
  ]
}
```

### 7.3 Get Station Details
Get detailed information about a specific station.

**Endpoint:** `GET /api/stations/:id`

**Path Parameters:**
- `id` - Station identifier from OpenCharge API

**Example Request:**
```
GET /api/stations/12345
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 12345,
    "name": "MG Road Charging Hub",
    "addressLine1": "123 MG Road",
    "town": "Bangalore",
    "stateOrProvince": "Karnataka",
    "postcode": "560001",
    "country": "India",
    "latitude": 12.9750,
    "longitude": 77.6088,
    "numberOfPoints": 8,
    "usageType": "Public",
    "statusType": "Operational",
    "connections": [
      {
        "id": 1,
        "connectionType": "Type 2",
        "powerKW": 50,
        "currentType": "AC",
        "quantity": 4,
        "statusType": "Operational"
      }
    ],
    "operatorInfo": {
      "title": "ChargePoint India",
      "websiteURL": "https://chargepoint.com"
    }
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Station not found",
  "error": "Station with ID 12345 not found"
}
```

### 7.4 Get Station Capacity
Get capacity information for scheduling.

**Endpoint:** `GET /api/stations/:id/capacity`

**Path Parameters:**
- `id` - Station identifier

**Example Request:**
```
GET /api/stations/12345/capacity
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "stationId": 12345,
    "totalPorts": 8,
    "availablePorts": 5,
    "maxPowerKW": 50,
    "supportedConnectors": ["Type 2", "CCS"],
    "canSchedule": true
  }
}
```

### 7.5 Validate Station for Scheduling
Check if station can handle a charging request.

**Endpoint:** `POST /api/stations/:id/validate`

**Path Parameters:**
- `id` - Station identifier

**Request Body:**
```json
{
  "requiredPowerKW": 50
}
```

**Optional Fields:**
- `requiredPowerKW` (Number) - Required power in kW (default: 25)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "stationId": 12345,
    "isValid": true,
    "canProvidePower": true,
    "availablePowerKW": 50,
    "message": "Station can handle the request"
  }
}
```

**Validation Failure:**
```json
{
  "success": true,
  "data": {
    "stationId": 12345,
    "isValid": false,
    "canProvidePower": false,
    "availablePowerKW": 25,
    "message": "Station cannot provide required power"
  }
}
```

### 7.6 Clear Station Cache
Clear cached station data (admin operation).

**Endpoint:** `DELETE /api/stations/cache`

**Example Request:**
```
DELETE /api/stations/cache
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Station cache cleared successfully"
}
```

**Note:** Station data is cached for 5 minutes to reduce API calls.

---

## 8. Report APIs

### 8.1 Get Grid Impact Report
Analyze peak load reduction and session shifting effectiveness.

**Endpoint:** `GET /api/report/grid-impact`

**Query Parameters:**
- `stationId` (required) - Station identifier
- `region` (required) - Geographic region

**Example Request:**
```
GET /api/report/grid-impact?stationId=5&region=Bangalore
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "stationId": 5,
    "region": "Bangalore",
    "peakLoadReducedBy": "18%",
    "offPeakShiftedSessions": 12,
    "averageUserDelayMinutes": 20,
    "totalSessionsAnalyzed": 45,
    "gridSafeSessions": 42,
    "priorityOverrides": 3,
    "reportPeriod": {
      "start": "2026-01-17T00:00:00.000Z",
      "end": "2026-01-24T00:00:00.000Z"
    }
  }
}
```

---

## Error Codes

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Error Response Format
```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error details"
}
```

---

## Configuration

### Environment Variables

Create a `.env` file in the Backend directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ev-charging

# Flask ML Service
FLASK_ML_SERVICE_URL=http://localhost:5000

# OpenCharge API
OPENCHARGE_API_KEY=your_api_key_here
OPENCHARGE_API_URL=https://api.openchargemap.io/v3

# Scheduling Configuration
LOAD_THRESHOLD_KW=90
MAX_SESSIONS_PER_HOUR=5
FAST_CHARGING_RATE_KW=50
SLOW_CHARGING_RATE_KW=25

# Grid Configuration
GRID_SAFETY_MARGIN=0.9

# Temperature Thresholds
TEMP_WARNING_CELSIUS=85
TEMP_CRITICAL_CELSIUS=110

# Load Thresholds
LOAD_WARNING_PERCENT=70
LOAD_CRITICAL_PERCENT=90
```

---

## Running the Services

### Start MongoDB
```bash
mongod --dbpath /path/to/data
```

### Start Flask ML Service
```bash
cd ML-Services
pip install -r requirements.txt
python app.py
```

### Start Express Backend
```bash
cd Backend
npm install
npm start
```

---

## Testing with cURL

### Log Power Usage
```bash
curl -X POST http://localhost:3000/api/power/log \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": 5,
    "powerKW": 88.5,
    "activePorts": 4,
    "region": "Bangalore"
  }'
```

### Get Hourly Demand
```bash
curl "http://localhost:3000/api/analytics/hourly?stationId=5"
```

### Request Smart Schedule
```bash
curl -X POST http://localhost:3000/api/schedule/request \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "EV101",
    "stationId": 5,
    "requiredKwh": 20,
    "deadline": "2026-01-24T21:00:00Z",
    "batteryLevel": 30,
    "priority": false
  }'
```

### Request Balanced Schedule
```bash
curl -X POST http://localhost:3000/api/schedule/balanced \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "EV201",
    "stationId": 5,
    "requiredKwh": 25,
    "deadline": "2026-01-24T22:00:00Z",
    "maxDelayMinutes": 45,
    "batteryLevel": 35,
    "region": "Bangalore"
  }'
```

### Update Grid Status
```bash
curl -X POST http://localhost:3000/api/grid/update \
  -H "Content-Type: application/json" \
  -d '{
    "region": "Bangalore",
    "currentLoadKW": 420,
    "maxSafeLoadKW": 500
  }'
```

### Find Nearby Stations
```bash
curl "http://localhost:3000/api/stations/nearby?lat=12.9716&lng=77.5946&radius=5"
```

---

## API Summary

| Category | Endpoints | Purpose |
|----------|-----------|---------|
| Power Logging | 1 | Store power usage data |
| Analytics | 3 | Demand pattern analysis |
| ML Prediction | 2 | Peak usage forecasting |
| Scheduling | 6 | Smart charging optimization |
| Balanced Scheduling | 1 | Grid-aware scheduling |
| Grid Management | 3 | Grid status monitoring |
| Stations | 6 | OpenCharge integration |
| Reports | 1 | Impact analysis |

**Total Endpoints: 23**

---

## Key Features

### Core Challenge 1: Demand Analysis ✅
- Hourly demand patterns
- Peak hour identification
- Regional trend analysis

### Core Challenge 2: Peak Prediction ✅
- ML-based forecasting
- 24-hour predictions
- LSTM model integration

### Core Challenge 3: Smart Scheduling ✅
- ML-driven slot selection
- Station capacity balancing
- Dynamic charging rates
- Priority override logic

### Core Challenge 4: Grid Balancing ✅
- Grid constraint enforcement
- User convenience optimization
- Delay minimization
- Peak load reduction

### OpenCharge Integration ✅
- Real-time station data
- Location-based search
- Capacity validation
- 5-minute caching

---

## Notes

1. **Station Metadata**: NOT stored in MongoDB. Always fetched from OpenCharge API.
2. **Caching**: Station data cached for 5 minutes to reduce API calls.
3. **Priority Logic**: Battery < 20% OR priority flag → immediate scheduling.
4. **Grid Safety**: 90% of maxSafeLoadKW used as threshold.
5. **Capacity Limit**: Maximum 5 sessions per hour per station.
6. **Charging Rates**: Fast = 50kW, Slow = 25kW.
7. **Temperature Limits**: Warning at 85°C, Critical at 110°C.
8. **Load Limits**: Warning at 70%, Critical at 90%.

---

**Documentation Version:** 1.0  
**Last Updated:** January 24, 2026  
**Backend Readiness:** 92%
