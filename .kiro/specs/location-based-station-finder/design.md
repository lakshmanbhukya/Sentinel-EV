# Design Document: Location-Based Station Finder

## Overview

This feature enhances the NearbyStationsPanel component by adding location search capabilities that integrate with the Open Charge Map API. Users can search for locations by entering city names, addresses, or coordinates, or use their current geolocation to discover nearby EV charging stations. The implementation is frontend-only, using React/TypeScript with the existing Tailwind CSS styling patterns.

The design follows a modular approach with clear separation of concerns:
- **UI Layer**: LocationSelector component for user input
- **Service Layer**: API integration and geocoding services
- **Data Layer**: Station data transformation and state management

## Architecture

### Component Structure

```
NearbyStationsPanel (Enhanced)
├── LocationSelector (New)
│   ├── SearchInput
│   ├── CurrentLocationButton
│   └── ErrorDisplay
├── LoadingIndicator (New)
└── StationList (Existing)
```

### Data Flow

1. **User Input** → LocationSelector captures search query or geolocation request
2. **Geocoding** → Convert search query to coordinates (if needed)
3. **API Request** → Fetch stations from Open Charge Map API using coordinates
4. **Data Transformation** → Map API response to Station interface
5. **State Update** → Update component state with fetched stations
6. **UI Render** → Display stations in existing list UI

### External Dependencies

- **Open Charge Map API**: `https://api.openchargemap.io/v3/poi/`
- **Browser Geolocation API**: `navigator.geolocation`
- **Geocoding Service**: Browser's built-in geocoding or Open Charge Map's location search

## Components and Interfaces

### 1. LocationSelector Component

**Purpose**: Provides UI for location search and geolocation

**Props**:
```typescript
interface LocationSelectorProps {
  onLocationSelected: (lat: number, lng: number, locationName: string) => void;
  onError: (error: string) => void;
  isLoading: boolean;
}
```

**State**:
```typescript
interface LocationSelectorState {
  searchQuery: string;
  isGeolocating: boolean;
}
```

**UI Elements**:
- Text input for search queries
- Search button to submit query
- Current location button with location icon
- Clear button to reset search

### 2. Open Charge Map Service

**Purpose**: Handle API communication with Open Charge Map

**Interface**:
```typescript
interface OCMService {
  fetchNearbyStations(
    latitude: number,
    longitude: number,
    maxResults?: number
  ): Promise<OCMStation[]>;
}
```

**API Parameters**:
- `key`: API key from VITE_OCM_API_KEY
- `output`: "json"
- `latitude`: Search center latitude
- `longitude`: Search center longitude
- `maxresults`: Maximum number of results (default: 100)
- `compact`: false (to get full data including reference objects)
- `verbose`: false

**API Response Structure** (based on research):
```typescript
interface OCMStation {
  UUID: string;
  AddressInfo: {
    Title: string;
    AddressLine1?: string;
    Town?: string;
    StateOrProvince?: string;
    Postcode?: string;
    Country?: {
      Title: string;
    };
    Latitude: number;
    Longitude: number;
  };
  Connections?: Array<{
    ConnectionTypeID: number;
    PowerKW?: number;
    Quantity?: number;
  }>;
  NumberOfPoints?: number;
  StatusType?: {
    IsOperational: boolean;
    Title: string;
  };
  OperatorInfo?: {
    Title: string;
  };
}
```

### 3. Geolocation Service

**Purpose**: Handle browser geolocation requests

**Interface**:
```typescript
interface GeolocationService {
  getCurrentPosition(): Promise<GeolocationCoordinates>;
}

interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}
```

**Error Handling**:
- `PERMISSION_DENIED`: User denied location access
- `POSITION_UNAVAILABLE`: Location information unavailable
- `TIMEOUT`: Request timed out

### 4. Station Mapper

**Purpose**: Transform Open Charge Map API responses to Station interface

**Interface**:
```typescript
interface StationMapper {
  mapOCMToStation(ocmStation: OCMStation): Station;
  mapOCMArrayToStations(ocmStations: OCMStation[]): Station[];
}
```

**Mapping Logic**:
- `id`: Use UUID from API or generate from coordinates
- `name`: Use AddressInfo.Title
- `lat`: Use AddressInfo.Latitude
- `lng`: Use AddressInfo.Longitude
- `address`: Construct from AddressLine1, Town, StateOrProvince
- `status`: Derive from StatusType.IsOperational (operational → 'safe', non-operational → 'warning', missing → 'safe')
- `load`: Generate random value between 20-80 (API doesn't provide real-time load)
- `temp`: Generate random value between 45-75 (API doesn't provide temperature)

### 5. Enhanced NearbyStationsPanel

**Updated Props**:
```typescript
interface NearbyStationsPanelProps {
  stations: Station[];
  selectedStationId: string | null;
  onSelectStation: (id: string, s: Station) => void;
  onNavigate: (lat: number, lng: number) => void;
  // New props for location search
  enableLocationSearch?: boolean; // Default: true
}
```

**New State**:
```typescript
interface PanelState {
  displayedStations: Station[];
  isLoading: boolean;
  error: string | null;
  currentLocation: string | null;
}
```

## Data Models

### Station Interface (Existing)

```typescript
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
```

### API Configuration

```typescript
interface APIConfig {
  baseURL: string;
  apiKey: string;
  defaultMaxResults: number;
  timeout: number;
}

const OCM_CONFIG: APIConfig = {
  baseURL: 'https://api.openchargemap.io/v3/poi/',
  apiKey: import.meta.env.VITE_OCM_API_KEY,
  defaultMaxResults: 100,
  timeout: 10000 // 10 seconds
};
```

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Non-empty input validation
*For any* search query string, if the string is empty or contains only whitespace, the system should reject the search and maintain the current state without making an API request.
**Validates: Requirements 1.3, 1.4**

### Property 2: API request includes authentication
*For any* API request to Open Charge Map, the request should include the API key from the VITE_OCM_API_KEY environment variable in the request parameters.
**Validates: Requirements 3.2**

### Property 3: API request excludes radius limit
*For any* API request to Open Charge Map, the request parameters should not include a distance or radius limit parameter.
**Validates: Requirements 3.3**

### Property 4: Station data transformation completeness
*For any* valid Open Charge Map API response, the Station_Mapper should transform each station into a Station object with all required fields (id, name, lat, lng, status, load, temp, address) populated with valid values.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 5: Unique station identifiers
*For any* list of stations returned by the Station_Mapper, all station IDs should be unique within that list.
**Validates: Requirements 4.6**

### Property 6: Station list replacement
*For any* successful station fetch operation, the newly fetched stations should completely replace the previously displayed stations in the UI.
**Validates: Requirements 5.2**

### Property 7: Existing functionality preservation
*For any* station in the fetched results, the selection and navigation behaviors should work identically to stations from the original mock data.
**Validates: Requirements 5.3, 5.4**

### Property 8: Loading state transitions
*For any* search operation, the loading indicator should be visible while the search is in progress and hidden once the search completes (either successfully or with an error).
**Validates: Requirements 6.1, 6.3, 6.4**

### Property 9: Input disabled during loading
*For any* search operation in progress, the search input and submit button should be disabled to prevent duplicate requests.
**Validates: Requirements 6.2**

### Property 10: Error state preserves data
*For any* error that occurs during station fetching, if there was a previously displayed station list, it should remain visible after the error.
**Validates: Requirements 7.5**

### Property 11: Error dismissibility
*For any* error message displayed to the user, there should be a mechanism (button or auto-dismiss) to remove the error message from the UI.
**Validates: Requirements 7.6**

### Property 12: Geolocation triggers search
*For any* successful geolocation retrieval, the system should automatically initiate a station search using the retrieved coordinates.
**Validates: Requirements 2.6**

### Property 13: Coordinate-based API requests
*For any* valid latitude and longitude pair, the system should be able to construct and send a properly formatted API request to Open Charge Map.
**Validates: Requirements 3.1**

## Error Handling

### Error Categories

1. **Network Errors**
   - Connection timeout
   - Network unavailable
   - DNS resolution failure
   - **Handling**: Display user-friendly message: "Unable to connect. Please check your internet connection."

2. **API Errors**
   - Invalid API key (401/403)
   - Rate limit exceeded (429)
   - Server error (500+)
   - **Handling**: Display appropriate message based on status code

3. **Geolocation Errors**
   - Permission denied
   - Position unavailable
   - Timeout
   - **Handling**: Display specific message explaining the issue and suggesting manual search

4. **Data Errors**
   - Invalid API response format
   - Missing required fields
   - Geocoding failure
   - **Handling**: Use default values where possible, display error if critical data missing

### Error State Management

```typescript
interface ErrorState {
  type: 'network' | 'api' | 'geolocation' | 'data' | null;
  message: string;
  dismissible: boolean;
  timestamp: number;
}
```

### Error Recovery

- Errors should not clear existing station data
- Users should be able to retry failed operations
- Error messages should auto-dismiss after 5 seconds (except critical errors)
- Provide clear actionable guidance in error messages

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

### Unit Testing Focus

Unit tests should focus on:
- Specific examples of successful location searches
- Edge cases: empty input, malformed coordinates, missing API responses
- Error conditions: network failures, permission denials, invalid API keys
- Integration points: component mounting, user interactions, API calls
- UI state transitions: loading → success, loading → error

### Property-Based Testing

**Testing Library**: Use `@fast-check/vitest` for TypeScript/React property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `// Feature: location-based-station-finder, Property {number}: {property_text}`

**Property Test Coverage**:

1. **Input Validation Properties** (Properties 1)
   - Generate random strings (empty, whitespace, valid text)
   - Verify validation behavior is consistent

2. **API Integration Properties** (Properties 2, 3, 13)
   - Generate random coordinate pairs
   - Verify API requests are properly formatted
   - Verify authentication and parameters

3. **Data Transformation Properties** (Properties 4, 5)
   - Generate random OCM API responses
   - Verify all stations are properly mapped
   - Verify ID uniqueness

4. **State Management Properties** (Properties 6, 7, 8, 9, 10, 11)
   - Generate random sequences of user actions
   - Verify state transitions are correct
   - Verify data preservation during errors

5. **Geolocation Properties** (Property 12)
   - Generate random coordinate pairs
   - Verify search is triggered with correct parameters

### Test Organization

```
tests/
├── unit/
│   ├── LocationSelector.test.tsx
│   ├── OCMService.test.ts
│   ├── GeolocationService.test.ts
│   ├── StationMapper.test.ts
│   └── NearbyStationsPanel.test.tsx
└── property/
    ├── inputValidation.property.test.ts
    ├── apiIntegration.property.test.ts
    ├── dataTransformation.property.test.ts
    └── stateManagement.property.test.ts
```

### Mocking Strategy

- Mock Open Charge Map API responses using MSW (Mock Service Worker)
- Mock browser geolocation API using jest.fn()
- Mock environment variables for API key testing
- Use React Testing Library for component testing

## Implementation Notes

### Performance Considerations

1. **Debouncing**: Implement 300ms debounce on search input to prevent excessive API calls
2. **Caching**: Consider caching API responses by coordinates (with expiration)
3. **Request Cancellation**: Cancel in-flight requests when new search is initiated
4. **Lazy Loading**: Load LocationSelector component only when needed

### Accessibility

- Search input should have proper ARIA labels
- Loading states should be announced to screen readers
- Error messages should be associated with form controls
- Keyboard navigation should work for all interactive elements
- Focus management during loading and error states

### Browser Compatibility

- Geolocation API is supported in all modern browsers
- Provide fallback message for browsers without geolocation support
- Test on Chrome, Firefox, Safari, Edge

### Security Considerations

- API key should be in environment variable (not hardcoded)
- Validate and sanitize all user inputs
- Use HTTPS for all API requests
- Handle CORS properly (Open Charge Map API supports CORS)

### Future Enhancements

- Add autocomplete for location search using geocoding service
- Add filters for station type, connector type, availability
- Add distance calculation and sorting by distance
- Add map view integration
- Add favorite locations
- Add recent searches history
