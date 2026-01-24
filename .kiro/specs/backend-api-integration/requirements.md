# Requirements Document

## Introduction

This feature establishes the connection between the React frontend (app-demo) and the Express backend (Backend) for the EV Charging Demand Analytics application. Currently, the frontend uses mock data because the backend API is unavailable or not properly connected. This integration will enable the frontend to fetch real charging station data from the backend, which in turn retrieves data from the OpenCharge API.

The integration must be implemented carefully to maintain the existing fallback mechanism and ensure no breaking changes to the current functionality.

## Glossary

- **Frontend**: The React + TypeScript + Vite application located in app-demo/
- **Backend**: The Node.js Express server located in Backend/
- **OpenCharge_Service**: The backend service that fetches charging station data from OpenCharge API
- **API_Client**: The frontend module that handles HTTP requests to the backend
- **Mock_Data**: Fallback station data used when the backend is unavailable
- **Station**: A charging station entity with location, capacity, and connection information
- **CORS**: Cross-Origin Resource Sharing, required for frontend-backend communication

## Requirements

### Requirement 1: Backend Server Configuration

**User Story:** As a developer, I want the backend server to be properly configured and running, so that the frontend can connect to it.

#### Acceptance Criteria

1. THE Backend SHALL run on a configurable port (default 3000)
2. THE Backend SHALL enable CORS to accept requests from the frontend origin
3. WHEN the backend starts, THE Backend SHALL log the server URL and port
4. THE Backend SHALL respond to health check requests at /health endpoint
5. THE Backend SHALL connect to MongoDB successfully before accepting requests

### Requirement 2: Frontend API Configuration

**User Story:** As a developer, I want the frontend to know where the backend is located, so that API requests are sent to the correct URL.

#### Acceptance Criteria

1. THE Frontend SHALL read the backend URL from environment variable VITE_API_BASE_URL
2. WHEN VITE_API_BASE_URL is not set, THE Frontend SHALL default to http://localhost:3000/api
3. THE Frontend SHALL support disabling backend via VITE_DISABLE_BACKEND environment variable
4. THE Frontend SHALL validate the backend URL format before making requests
5. THE Frontend SHALL log the configured backend URL on application startup

### Requirement 3: Station Data API Integration

**User Story:** As a user, I want the application to fetch real charging station data from the backend, so that I see accurate and up-to-date information.

#### Acceptance Criteria

1. WHEN the frontend requests nearby stations, THE API_Client SHALL send a GET request to /api/stations/nearby with lat, lng, and radius parameters
2. WHEN the backend receives a valid station request, THE Backend SHALL return station data in the expected format with success: true
3. WHEN the backend request succeeds, THE Frontend SHALL transform and display the received station data
4. WHEN the backend request fails or returns empty data, THE Frontend SHALL fall back to mock data without breaking the UI
5. THE Frontend SHALL indicate to the user whether real or mock data is being displayed

### Requirement 4: Error Handling and Resilience

**User Story:** As a user, I want the application to continue working even when the backend is unavailable, so that I can still use the application with mock data.

#### Acceptance Criteria

1. WHEN the backend is unreachable, THE Frontend SHALL fall back to mock data within the configured timeout period
2. WHEN the backend returns an error response, THE Frontend SHALL log the error and use mock data
3. WHEN network requests timeout, THE Frontend SHALL cancel the request and use mock data
4. THE Frontend SHALL NOT display error messages to users when falling back to mock data
5. THE Frontend SHALL log all backend connection issues to the console for debugging

### Requirement 5: Backend Service Validation

**User Story:** As a developer, I want to verify that the backend OpenCharge service is working correctly, so that I can troubleshoot integration issues.

#### Acceptance Criteria

1. THE Backend SHALL validate that the OPENCHARGE_API_KEY is configured before starting
2. WHEN the OpenCharge API is unavailable, THE Backend SHALL return a descriptive error message
3. THE Backend SHALL cache station data to reduce external API calls
4. THE Backend SHALL log all requests to the OpenCharge API for monitoring
5. WHEN station data is successfully retrieved, THE Backend SHALL include metadata about the data source

### Requirement 6: Development Environment Setup

**User Story:** As a developer, I want clear instructions for running both frontend and backend, so that I can test the integration locally.

#### Acceptance Criteria

1. THE Backend SHALL provide an .env.example file with all required configuration variables
2. THE Frontend SHALL provide an .env.example file with all required configuration variables
3. THE Backend SHALL start successfully with npm run dev command
4. THE Frontend SHALL start successfully with npm run dev command
5. WHEN both servers are running, THE Frontend SHALL successfully connect to the Backend

### Requirement 7: Connection Status Monitoring

**User Story:** As a developer, I want to monitor the connection status between frontend and backend, so that I can quickly identify integration issues.

#### Acceptance Criteria

1. THE Frontend SHALL log each API request with the endpoint and parameters
2. THE Frontend SHALL log whether each request succeeded or fell back to mock data
3. THE Backend SHALL log each incoming request with timestamp and client information
4. THE Backend SHALL log response status and data size for each request
5. WHEN the frontend detects the backend is unavailable, THE Frontend SHALL log a clear warning message

### Requirement 8: Data Format Compatibility

**User Story:** As a developer, I want the backend response format to match the frontend expectations, so that data transformation is minimal and reliable.

#### Acceptance Criteria

1. THE Backend SHALL return station data with all required fields: id, name, latitude, longitude, connections
2. THE Backend SHALL wrap all responses in a consistent format with success, data, and message fields
3. WHEN transforming backend data, THE Frontend SHALL handle missing optional fields gracefully
4. THE Frontend SHALL validate received station data before using it
5. WHEN validation fails, THE Frontend SHALL log the validation error and use mock data
