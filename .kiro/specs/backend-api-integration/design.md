# Design Document: Backend API Integration

## Overview

This design establishes the connection between the React frontend (app-demo) and Express backend (Backend) for the EV Charging Demand Analytics application. The integration enables real-time charging station data retrieval while maintaining robust fallback mechanisms to ensure the application never breaks.

The design follows a defense-in-depth approach with multiple layers of error handling:
1. **Environment configuration** - Flexible backend URL configuration
2. **Request timeout** - Prevents hanging requests
3. **Graceful degradation** - Automatic fallback to mock data
4. **Silent failures** - No user-facing errors for backend unavailability
5. **Comprehensive logging** - Full visibility for debugging

### Key Design Principles

- **Zero Breaking Changes**: Existing mock data fallback remains fully functional
- **Progressive Enhancement**: Real data when available, mock data as fallback
- **Developer Experience**: Clear logging and configuration
- **Production Ready**: CORS, error handling, and caching built-in

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend                          │
│                     (app-demo/)                              │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │ useStations  │───▶│  API Client  │───▶│ Transformers │ │
│  │    Data      │    │              │    │ & Validators │ │
│  └──────────────┘    └──────┬───────┘    └──────────────┘ │
│         │                    │                              │
│         │                    │ HTTP Request                 │
│         │                    │ (with timeout)               │
│         ▼                    ▼                              │
│  ┌──────────────┐    ┌──────────────┐                     │
│  │  Mock Data   │◀───│ Fallback     │                     │
│  │  (STATIONS)  │    │ Logic        │                     │
│  └──────────────┘    └──────────────┘                     │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              │ CORS-enabled
                              │ HTTP/JSON
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                    Express Backend                           │
│                     (Backend/)                               │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Station    │───▶│  OpenCharge  │───▶│  NodeCache   │ │
│  │  Controller  │    │   Service    │    │  (5 min TTL) │ │
│  └──────────────┘    └──────┬───────┘    └──────────────┘ │
│                              │                              │
│                              │ HTTPS Request                │
│                              │ (with retry)                 │
└──────────────────────────────┼──────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  OpenCharge API  │
                    │ (External Service)│
                    └──────────────────┘
```

### Data Flow

1. **Frontend Request**: User action triggers `useStationsData` hook
2. **API Call**: `getNearbyStations()` sends GET request to backend
3. **Backend Processing**: Controller validates params, checks cache
4. **External API**: OpenCharge service fetches data (if not cached)
5. **Response Transform**: Backend formats data to expected schema
6. **Frontend Validation**: Validators check response structure
7. **Data Transform**: Transformers convert to frontend types
8. **Fallback Logic**: On any failure, use mock data silently

### Error Handling Flow

```
API Request
    │
    ├─▶ Timeout (5s) ────────────────────┐
    │                                     │
    ├─▶ Network Error ───────────────────┤
    │                                     │
    ├─▶ Backend Unavailable ─────────────┤
    │                                     │
    ├─▶ Invalid Response ────────────────┤
    │                                     │
    ├─▶ Empty Data ──────────────────────┤
    │                                     │
    └─▶ Success ──▶ Validate ──▶ Transform
                        │
                        ├─▶ Valid ──▶ Display Real Data
                        │
                        └─▶ Invalid ──────────────────┐
                                                       │
                                                       ▼
                                            Use Mock Data
                                            Log Warning
                                            Set isMock=true
```

## Components and Interfaces

### Frontend Components

#### 1. Environment Configuration (.env)

```typescript
// app-demo/.env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_DISABLE_BACKEND=false
VITE_OCM_API_KEY=YOUR_API_KEY
```

**Purpose**: Configure backend connection without code changes

**Fields**:
- `VITE_API_BASE_URL`: Backend URL (default: http://localhost:3000/api)
- `VITE_DISABLE_BACKEND`: Force mock data mode (default: false)
- `VITE_OCM_API_KEY`: OpenCharge API key (for reference)

#### 2. API Configuration Module (apiConfig.ts)

```typescript
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export const isBackendEnabled = () => {
  return import.meta.env.VITE_DISABLE_BACKEND !== 'true';
};
```

**Purpose**: Centralize API configuration and response types

**Key Functions**:
- `isBackendEnabled()`: Check if backend should be used
- `API_CONFIG`: Configuration object with defaults

#### 3. API Client Module (apiClient.ts)

**Existing Implementation**: Already handles timeouts, errors, and null returns

**Key Functions**:
- `apiFetch<T>()`: Core fetch wrapper with timeout and error handling
- `apiGet<T>()`: GET request helper with query params
- `apiPost<T>()`: POST request helper with JSON body

**Error Handling Strategy**:
- Returns `null` on any error (never throws)
- Logs warnings to console
- Allows callers to implement fallback logic

#### 4. Stations API Module (stationsApi.ts)

**Existing Implementation**: Already defines types and API functions

**Key Functions**:
- `getNearbyStations()`: Fetch stations by coordinates
- `getStationsByCity()`: Fetch stations by city name
- `getStationDetails()`: Fetch single station details
- `getStationCapacity()`: Fetch station capacity info
- `validateStation()`: Validate station for scheduling

**Response Handling**:
- Checks `response.success` flag
- Returns `null` on failure
- Caller handles fallback

#### 5. Data Transformers (transformers.ts)

**Existing Implementation**: Already transforms backend to frontend types

**Key Function**: `transformStation()`

**Transformation Logic**:
- Maps `BackendStation` → `Station`
- Converts status types (operational/busy/offline → safe/warning/critical)
- Generates simulated load/temp values
- Formats address from components

#### 6. Data Validators (validators.ts)

**Existing Implementation**: Already validates response shapes

**Key Functions**:
- `isValidStation()`: Validates single station object
- `isValidStationList()`: Validates station array
- Runtime type checking for safety

#### 7. useStationsData Hook (useStationsData.ts)

**Existing Implementation**: Already implements fallback logic

**Current Behavior**:
- Attempts to fetch from backend
- Validates response
- Falls back to mock data on any failure
- Tracks `isMock` state
- Logs all operations

**Enhancement Needed**: Add startup logging for backend URL

### Backend Components

#### 1. Environment Configuration (.env)

```bash
# Backend/.env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ev-charging
FLASK_ML_SERVICE_URL=http://localhost:5000
OPENCHARGE_API_KEY=your_api_key_here
OPENCHARGE_BASE_URL=https://api.openchargemap.io/v3
STATION_CACHE_TTL_SECONDS=300
```

**Purpose**: Configure backend services and external APIs

**Critical Fields**:
- `PORT`: Server port (must match frontend VITE_API_BASE_URL)
- `OPENCHARGE_API_KEY`: Required for OpenCharge API access
- `STATION_CACHE_TTL_SECONDS`: Cache duration (default: 5 minutes)

#### 2. Server Configuration (server.js)

**Existing Implementation**: Already configured with CORS and routes

**CORS Configuration**:
```javascript
app.use(cors()); // Allows all origins in development
```

**Routes**:
- `/api/stations/*` → stationRoutes

**Health Check**:
- `GET /health` → Returns server status

**Enhancement Needed**: Validate OPENCHARGE_API_KEY on startup

#### 3. Station Routes (stationRoutes.js)

**Existing Implementation**: Already defines all required endpoints

**Endpoints**:
- `GET /api/stations/nearby` → getNearbyStations
- `GET /api/stations/city/:cityName` → getStationsByCity
- `GET /api/stations/:id` → getStationDetails
- `GET /api/stations/:id/capacity` → getStationCapacity
- `POST /api/stations/:id/validate` → validateStation
- `DELETE /api/stations/cache` → clearCache

#### 4. Station Controller (stationController.js)

**Existing Implementation**: Already handles requests and validation

**Key Functions**:
- Parameter validation (lat, lng, radius)
- Error response formatting
- Success response wrapping
- Delegates to OpenChargeService

**Response Format**:
```javascript
{
  success: true,
  count: 10,
  searchParams: { lat, lng, radius },
  data: [...stations]
}
```

#### 5. OpenCharge Service (openChargeService.js)

**Existing Implementation**: Already handles external API and caching

**Key Features**:
- NodeCache with 5-minute TTL
- Automatic retry on 5xx errors
- City geocoding for major Indian cities
- Data formatting and transformation

**Key Functions**:
- `getStationsByLocation()`: Fetch by coordinates
- `getNearbyStations()`: Fetch by city name
- `getStationDetails()`: Fetch single station
- `getStationCapacity()`: Calculate capacity
- `validateStationForScheduling()`: Validate for scheduling
- `clearCache()`: Clear cached data

**Caching Strategy**:
- Cache key: `stations_{lat}_{lng}_{radius}`
- TTL: 300 seconds (5 minutes)
- Reduces external API calls
- Improves response time

## Data Models

### Frontend Types

#### Station (Frontend Model)

```typescript
interface Station {
  id: string;           // Station identifier
  name: string;         // Station name
  lat: number;          // Latitude
  lng: number;          // Longitude
  status: 'safe' | 'warning' | 'critical';  // Operational status
  load: number;         // Current load (0-100)
  temp: number;         // Temperature (°C)
  address: string;      // Formatted address
}
```

#### BackendStation (API Response Model)

```typescript
interface BackendStation {
  id: number;                    // OpenCharge station ID
  name: string;                  // Station name
  addressLine1: string;          // Address line 1
  town: string;                  // City/town
  stateOrProvince?: string;      // State/province
  postcode?: string;             // Postal code
  country?: string;              // Country
  latitude: number;              // Latitude
  longitude: number;             // Longitude
  distance?: number;             // Distance from search point (km)
  numberOfPoints: number;        // Number of charging points
  usageType: string;             // Public/Private
  statusType: string;            // Operational/Busy/Offline
  connections?: StationConnection[];  // Available connectors
  operatorInfo?: {
    title: string;
    websiteURL?: string;
  };
}
```

#### StationConnection

```typescript
interface StationConnection {
  id?: number;
  connectionType: string;   // Type 2, CCS, CHAdeMO, etc.
  powerKW: number;          // Power rating
  currentType: string;      // AC/DC
  quantity: number;         // Number of this connector type
  statusType?: string;      // Available/In Use/Out of Service
}
```

### Backend Types

#### OpenCharge API Response (Raw)

```javascript
{
  ID: number,
  AddressInfo: {
    Title: string,
    AddressLine1: string,
    Town: string,
    StateOrProvince: string,
    Postcode: string,
    Latitude: number,
    Longitude: number,
    Distance: number,
    Country: { Title: string }
  },
  Connections: [{
    ID: number,
    ConnectionType: { Title: string },
    PowerKW: number,
    CurrentType: { Title: string },
    Level: { Title: string },
    Quantity: number
  }],
  StatusType: { Title: string },
  OperatorInfo: {
    Title: string,
    WebsiteURL: string
  },
  NumberOfPoints: number,
  UsageCost: string
}
```

#### Formatted Station Response

```javascript
{
  stationId: number,
  name: string,
  lat: number,
  lng: number,
  address: string,
  connectors: number,
  maxPowerKW: number,
  status: string,
  operatorName: string,
  usageCost: string,
  distance: string
}
```

### Data Transformation Mapping

| OpenCharge Field | Backend Field | Frontend Field | Transformation |
|-----------------|---------------|----------------|----------------|
| ID | id | id | Number → String |
| AddressInfo.Title | name | name | Direct |
| AddressInfo.Latitude | latitude | lat | Direct |
| AddressInfo.Longitude | longitude | lng | Direct |
| StatusType.Title | statusType | status | Map to safe/warning/critical |
| Connections.length | numberOfPoints | - | Count connectors |
| Connections[].PowerKW | - | - | Calculate max power |
| - | - | load | Generate random (10-90) |
| - | - | temp | Generate random (40-80) |
| AddressInfo.* | addressLine1, town, etc. | address | Format as comma-separated |

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: URL Validation Correctness

*For any* string input to the URL validator, valid HTTP/HTTPS URLs should pass validation and invalid URLs should fail validation.

**Validates: Requirements 2.4**

### Property 2: API Request Construction

*For any* valid latitude, longitude, and radius values, the API client should construct a GET request to `/api/stations/nearby` with the correct query parameters in the URL.

**Validates: Requirements 3.1**

### Property 3: Response Format Consistency

*For any* successful backend response, the response should contain a `success: true` field, a `data` field with the payload, and optionally a `message` field, maintaining consistent structure across all endpoints.

**Validates: Requirements 3.2, 8.2**

### Property 4: Data Transformation Preserves Core Fields

*For any* valid BackendStation object, transforming it to a frontend Station should preserve the core location data (id, name, latitude, longitude) and produce a valid Station object with all required fields.

**Validates: Requirements 3.3, 8.3**

### Property 5: Graceful Fallback on Errors

*For any* error condition (network failure, invalid response, empty data, validation failure), the frontend should return mock station data without throwing errors or displaying error messages to users, and should set the `isMock` flag to true.

**Validates: Requirements 3.4, 4.2, 4.4, 8.5**

### Property 6: Mock Flag Accuracy

*For any* data fetch operation, the `isMock` flag should be true when using mock data and false when using real backend data, accurately reflecting the data source.

**Validates: Requirements 3.5**

### Property 7: Cache Hit Consistency

*For any* station request with identical parameters (lat, lng, radius), making the same request twice within the cache TTL period should return the same data on the second request without calling the external OpenCharge API.

**Validates: Requirements 5.3**

### Property 8: Required Fields Presence

*For any* station object in a backend response, it should contain all required fields: id (number), name (string), latitude (number), longitude (number), and connections (array).

**Validates: Requirements 8.1**

### Property 9: Transformation Handles Missing Optional Fields

*For any* BackendStation object with missing optional fields (stateOrProvince, postcode, country, operatorInfo), the transformation to frontend Station should complete successfully without errors.

**Validates: Requirements 8.3**

## Error Handling

### Frontend Error Handling Strategy

The frontend implements a **silent failure** pattern for backend connectivity:

1. **Never Throw to UI**: All API errors are caught and handled internally
2. **Automatic Fallback**: Mock data is used seamlessly when backend fails
3. **Console Logging**: All errors logged for developer debugging
4. **User Transparency**: `isMock` flag indicates data source

### Error Scenarios and Responses

| Error Scenario | Frontend Behavior | User Impact |
|---------------|-------------------|-------------|
| Backend unreachable | Use mock data, log warning | None - sees mock data |
| Request timeout (5s) | Cancel request, use mock data | None - sees mock data |
| Invalid response format | Validate fails, use mock data | None - sees mock data |
| Empty data array | Treat as failure, use mock data | None - sees mock data |
| Network error | Catch error, use mock data | None - sees mock data |
| Backend returns success:false | Treat as failure, use mock data | None - sees mock data |

### Backend Error Handling Strategy

The backend implements **descriptive error responses** with proper HTTP status codes:

1. **Validation Errors**: 400 Bad Request with error message
2. **Not Found**: 404 Not Found for missing stations
3. **External API Errors**: 500 Internal Server Error with error details
4. **Retry Logic**: Automatic retry once on 5xx errors from OpenCharge
5. **Consistent Format**: All errors wrapped in `{ success: false, message, error }`

### Error Response Format

```javascript
{
  success: false,
  message: "Human-readable error message",
  error: "Technical error details"
}
```

### Timeout Configuration

- **Frontend Request Timeout**: 5000ms (5 seconds)
- **Backend OpenCharge Timeout**: 10000ms (10 seconds)
- **Rationale**: Frontend timeout shorter to fail fast and use mock data

### Retry Strategy

- **Frontend**: No retries (fail fast to mock data)
- **Backend**: One automatic retry on 5xx errors from OpenCharge
- **Delay**: 1000ms between retries

## Testing Strategy

### Dual Testing Approach

This feature requires both **unit tests** and **property-based tests** for comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library Selection**:
- **Frontend**: fast-check (already in package.json)
- **Backend**: fast-check (needs to be added)

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `// Feature: backend-api-integration, Property N: [property text]`

**Property Test Implementation**:
- Each correctness property MUST be implemented by a SINGLE property-based test
- Tests should generate random valid inputs
- Tests should verify the property holds for all generated inputs

### Unit Testing Strategy

**Frontend Unit Tests** (Vitest):
- API configuration reading (examples for 2.1, 2.2, 2.3)
- CORS header verification (example for 1.2)
- Health check endpoint (example for 1.4)
- Timeout behavior (example for 4.1, 4.3)
- Backend unavailability (example for 7.5)
- Environment file validation (examples for 6.1, 6.2)
- Integration test (example for 6.5)

**Backend Unit Tests** (needs test framework):
- OpenCharge API key validation (example for 5.1)
- External API unavailability (example for 5.2)
- Logging behavior (examples for 1.3, 2.5, 7.1-7.4)

### Integration Testing

**End-to-End Flow**:
1. Start backend server
2. Start frontend dev server
3. Verify frontend can fetch real data from backend
4. Verify fallback to mock data when backend stopped
5. Verify cache behavior with repeated requests

**Test Environment**:
- Use test MongoDB instance
- Use test OpenCharge API key
- Configure short cache TTL for testing

### Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Property Tests**: All 9 correctness properties implemented
- **Integration Tests**: Critical user flows covered
- **Error Scenarios**: All error paths tested

### Testing Priority

1. **High Priority** (Must have):
   - Property 5: Graceful fallback on errors
   - Property 3: Response format consistency
   - Property 4: Data transformation correctness
   - Property 8: Required fields presence

2. **Medium Priority** (Should have):
   - Property 6: Mock flag accuracy
   - Property 7: Cache hit consistency
   - Property 9: Transformation handles missing fields

3. **Low Priority** (Nice to have):
   - Property 1: URL validation
   - Property 2: API request construction

### Mocking Strategy

**Frontend Tests**:
- Mock `fetch` API for API client tests
- Mock environment variables for config tests
- Use real transformers and validators (no mocking)

**Backend Tests**:
- Mock axios for OpenCharge service tests
- Mock NodeCache for cache tests
- Use real controllers and routes (integration style)

## Implementation Notes

### Configuration Steps

1. **Backend Setup**:
   ```bash
   cd Backend
   cp .env.example .env
   # Edit .env and add OPENCHARGE_API_KEY
   npm install
   npm run dev
   ```

2. **Frontend Setup**:
   ```bash
   cd app-demo
   # Create .env file
   echo "VITE_API_BASE_URL=http://localhost:3000/api" > .env
   echo "VITE_DISABLE_BACKEND=false" >> .env
   npm install
   npm run dev
   ```

3. **Verify Connection**:
   - Open browser console
   - Look for log: "Loaded X real stations from API"
   - If you see "Using mock stations data", check backend is running

### Development Workflow

1. **Start Backend First**: Always start backend before frontend
2. **Check Logs**: Monitor both console outputs for errors
3. **Test Fallback**: Stop backend to verify mock data fallback works
4. **Clear Cache**: Use `DELETE /api/stations/cache` to clear cache during testing

### Production Considerations

1. **CORS Configuration**: Update CORS to allow only production frontend origin
2. **Environment Variables**: Use production backend URL in frontend .env
3. **API Key Security**: Never commit .env files with real API keys
4. **Error Monitoring**: Add error tracking service (e.g., Sentry)
5. **Rate Limiting**: Add rate limiting to backend endpoints
6. **Cache Strategy**: Consider longer cache TTL in production (15-30 minutes)

### Debugging Tips

**Frontend Not Connecting**:
- Check `VITE_API_BASE_URL` in .env
- Verify backend is running on correct port
- Check browser console for CORS errors
- Verify `VITE_DISABLE_BACKEND` is not set to 'true'

**Backend Errors**:
- Verify `OPENCHARGE_API_KEY` is set in .env
- Check MongoDB is running
- Verify port 3000 is not in use
- Check backend console for error messages

**Always Getting Mock Data**:
- Verify backend is running
- Check backend URL is correct
- Verify OpenCharge API key is valid
- Check backend logs for errors
- Try clearing browser cache

### Security Considerations

1. **API Key Protection**: OpenCharge API key should only be in backend .env
2. **Input Validation**: Backend validates all user inputs (lat, lng, radius)
3. **CORS**: Configure CORS to allow only trusted origins
4. **Rate Limiting**: Prevent abuse of backend endpoints
5. **Error Messages**: Don't expose internal errors to frontend users

### Performance Optimization

1. **Caching**: 5-minute cache reduces OpenCharge API calls by ~90%
2. **Request Timeout**: 5-second frontend timeout prevents hanging UI
3. **Lazy Loading**: Station data loaded on-demand, not on app startup
4. **Data Transformation**: Minimal transformation overhead
5. **Mock Data Fallback**: Instant fallback ensures responsive UI

### Monitoring and Observability

**Metrics to Track**:
- Backend API response times
- Cache hit rate
- OpenCharge API call frequency
- Frontend fallback rate (how often mock data is used)
- Error rates by type

**Logging Strategy**:
- Frontend: Console logs for all API operations
- Backend: Structured logs for requests, responses, errors
- External API: Log all OpenCharge API calls and responses

**Health Checks**:
- Backend: `/health` endpoint
- MongoDB: Connection status
- OpenCharge API: Periodic connectivity check
