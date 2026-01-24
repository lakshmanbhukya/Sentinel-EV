# Implementation Plan: Location-Based Station Finder

## Overview

This implementation plan breaks down the location-based station finder feature into discrete, incremental coding tasks. Each task builds on previous work, with testing integrated throughout to validate functionality early. The implementation follows a bottom-up approach: services first, then data transformation, then UI components, and finally integration.

## Tasks

- [ ] 1. Set up API service infrastructure
  - [ ] 1.1 Create OCM API service module with TypeScript interfaces
    - Create `src/services/ocmService.ts` file
    - Define `OCMStation` interface matching Open Charge Map API response structure
    - Define `OCMService` interface with `fetchNearbyStations` method
    - Implement API configuration with environment variable for API key
    - _Requirements: 3.1, 3.2_
  
  - [ ] 1.2 Write property test for API authentication
    - **Property 2: API request includes authentication**
    - **Validates: Requirements 3.2**
    - Generate random coordinate pairs and verify API key is included in all requests
    - _Requirements: 3.2_
  
  - [ ] 1.3 Write property test for radius limit exclusion
    - **Property 3: API request excludes radius limit**
    - **Validates: Requirements 3.3**
    - Generate random API requests and verify no distance/radius parameter is included
    - _Requirements: 3.3_

- [ ] 2. Implement station data transformation
  - [ ] 2.1 Create StationMapper module
    - Create `src/services/stationMapper.ts` file
    - Implement `mapOCMToStation` function to transform single OCM station to Station interface
    - Implement `mapOCMArrayToStations` function for array transformation
    - Handle missing fields with sensible defaults
    - Generate appropriate values for status, load, and temp fields
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [ ] 2.2 Write property test for data transformation completeness
    - **Property 4: Station data transformation completeness**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
    - Generate random OCM API responses and verify all required Station fields are populated
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ] 2.3 Write property test for unique station IDs
    - **Property 5: Unique station identifiers**
    - **Validates: Requirements 4.6**
    - Generate random lists of OCM stations and verify all mapped station IDs are unique
    - _Requirements: 4.6_
  
  - [ ] 2.4 Write unit tests for edge cases
    - Test handling of missing AddressInfo fields
    - Test handling of null/undefined values
    - Test address construction with partial data
    - _Requirements: 4.7_

- [ ] 3. Implement geolocation service
  - [ ] 3.1 Create GeolocationService module
    - Create `src/services/geolocationService.ts` file
    - Implement `getCurrentPosition` function wrapping browser geolocation API
    - Return Promise with coordinates or reject with typed error
    - Handle all geolocation error types (PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT)
    - _Requirements: 2.2, 2.3, 2.4, 2.5_
  
  - [ ] 3.2 Write unit tests for geolocation error handling
    - Test PERMISSION_DENIED error handling
    - Test POSITION_UNAVAILABLE error handling
    - Test TIMEOUT error handling
    - Mock navigator.geolocation for testing
    - _Requirements: 2.4, 2.5_

- [ ] 4. Create LocationSelector component
  - [ ] 4.1 Implement LocationSelector UI component
    - Create `src/components/ui/LocationSelector.tsx` file
    - Implement search input with Tailwind CSS styling (slate/blue theme)
    - Implement current location button with location icon
    - Implement clear button functionality
    - Add proper ARIA labels for accessibility
    - _Requirements: 1.1, 1.2, 2.1, 8.1, 8.2_
  
  - [ ] 4.2 Implement input validation and state management
    - Add state for search query and loading states
    - Implement non-empty validation before search submission
    - Disable input during loading
    - Handle search submission and geolocation button clicks
    - _Requirements: 1.3, 1.4, 1.5, 6.2_
  
  - [ ] 4.3 Write property test for input validation
    - **Property 1: Non-empty input validation**
    - **Validates: Requirements 1.3, 1.4**
    - Generate random strings (empty, whitespace, valid) and verify validation behavior
    - _Requirements: 1.3, 1.4_
  
  - [ ] 4.4 Write unit tests for LocationSelector
    - Test component renders with search input and location button
    - Test search submission with valid input
    - Test search prevention with empty input
    - Test current location button click
    - _Requirements: 1.1, 2.1_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Integrate API service with real requests
  - [ ] 6.1 Implement OCM API fetch logic
    - Complete `fetchNearbyStations` implementation in `ocmService.ts`
    - Use fetch API with proper error handling
    - Set 10-second timeout for requests
    - Parse JSON response and return OCMStation array
    - Handle network errors, API errors, and empty responses
    - _Requirements: 3.1, 3.4, 3.5, 3.6_
  
  - [ ] 6.2 Write property test for coordinate-based API requests
    - **Property 13: Coordinate-based API requests**
    - **Validates: Requirements 3.1**
    - Generate random valid coordinate pairs and verify API requests are properly formatted
    - _Requirements: 3.1_
  
  - [ ] 6.3 Write unit tests for API error handling
    - Test network error handling
    - Test API authentication error (401/403)
    - Test empty response handling
    - Use MSW (Mock Service Worker) to mock API responses
    - _Requirements: 3.5, 3.6_

- [ ] 7. Enhance NearbyStationsPanel with location search
  - [ ] 7.1 Add location search state to NearbyStationsPanel
    - Add state for displayed stations, loading, error, and current location
    - Add `enableLocationSearch` prop (default true)
    - Implement `handleLocationSelected` callback
    - Implement `handleError` callback
    - _Requirements: 5.1, 5.2, 6.1, 7.5_
  
  - [ ] 7.2 Integrate LocationSelector into NearbyStationsPanel
    - Render LocationSelector at top of panel when `enableLocationSearch` is true
    - Pass loading state and callbacks to LocationSelector
    - Maintain existing station list rendering
    - _Requirements: 1.1, 8.2_
  
  - [ ] 7.3 Implement station fetching and display logic
    - Call OCM API service when location is selected
    - Transform API response using StationMapper
    - Update displayed stations state with fetched results
    - Replace previous stations with new results
    - Maintain existing station list during loading
    - _Requirements: 3.1, 4.1, 5.1, 5.2, 5.5_
  
  - [ ] 7.4 Write property test for station list replacement
    - **Property 6: Station list replacement**
    - **Validates: Requirements 5.2**
    - Generate random station lists and verify new data replaces old data
    - _Requirements: 5.2_
  
  - [ ] 7.5 Write property test for existing functionality preservation
    - **Property 7: Existing functionality preservation**
    - **Validates: Requirements 5.3, 5.4**
    - Verify selection and navigation work identically for fetched stations
    - _Requirements: 5.3, 5.4_

- [ ] 8. Implement loading states and indicators
  - [ ] 8.1 Create loading indicator component
    - Add loading spinner or skeleton UI
    - Style with Tailwind CSS matching existing theme
    - Position appropriately in panel
    - _Requirements: 1.5, 6.1_
  
  - [ ] 8.2 Implement loading state management
    - Show loading indicator when search starts
    - Hide loading indicator when search completes
    - Disable search input during loading
    - Allow cancellation of in-flight requests
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 8.3 Write property test for loading state transitions
    - **Property 8: Loading state transitions**
    - **Validates: Requirements 6.1, 6.3, 6.4**
    - Generate random search sequences and verify loading indicator visibility
    - _Requirements: 6.1, 6.3, 6.4_
  
  - [ ] 8.4 Write property test for input disabled during loading
    - **Property 9: Input disabled during loading**
    - **Validates: Requirements 6.2**
    - Verify search input is disabled while loading is in progress
    - _Requirements: 6.2_

- [ ] 9. Implement error handling and display
  - [ ] 9.1 Create error display component
    - Create error message component with dismiss button
    - Style with Tailwind CSS (red/amber theme for errors)
    - Support different error types (network, API, geolocation, data)
    - Implement auto-dismiss after 5 seconds for non-critical errors
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_
  
  - [ ] 9.2 Integrate error handling throughout the flow
    - Handle network errors with user-friendly messages
    - Handle API errors with appropriate messages based on status code
    - Handle geolocation errors with specific guidance
    - Preserve existing station list when errors occur
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 9.3 Write property test for error state data preservation
    - **Property 10: Error state preserves data**
    - **Validates: Requirements 7.5**
    - Generate random error scenarios and verify existing data is preserved
    - _Requirements: 7.5_
  
  - [ ] 9.4 Write property test for error dismissibility
    - **Property 11: Error dismissibility**
    - **Validates: Requirements 7.6**
    - Verify all error messages can be dismissed by user
    - _Requirements: 7.6_
  
  - [ ] 9.5 Write unit tests for specific error scenarios
    - Test network error message display
    - Test API authentication error message
    - Test geolocation permission denied message
    - Test geocoding failure message
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 10. Implement geolocation integration
  - [ ] 10.1 Connect geolocation service to LocationSelector
    - Call GeolocationService when current location button is clicked
    - Handle successful geolocation retrieval
    - Handle geolocation errors
    - Trigger station search with retrieved coordinates
    - _Requirements: 2.2, 2.3, 2.6_
  
  - [ ] 10.2 Write property test for geolocation triggers search
    - **Property 12: Geolocation triggers search**
    - **Validates: Requirements 2.6**
    - Generate random coordinates and verify search is initiated automatically
    - _Requirements: 2.6_
  
  - [ ] 10.3 Write unit tests for geolocation flow
    - Test successful geolocation and search initiation
    - Test geolocation permission denied handling
    - Test geolocation error handling
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

- [ ] 11. Add performance optimizations
  - [ ] 11.1 Implement search input debouncing
    - Add 300ms debounce to search input
    - Cancel previous debounce timer on new input
    - _Requirements: 1.2_
  
  - [ ] 11.2 Implement request cancellation
    - Cancel in-flight API requests when new search is initiated
    - Use AbortController for fetch cancellation
    - _Requirements: 6.5_

- [ ] 12. Final integration and testing
  - [ ] 12.1 Test complete user flows
    - Test search by city name flow
    - Test search by address flow
    - Test current location flow
    - Test error recovery flows
    - Verify all existing functionality still works
    - _Requirements: All_
  
  - [ ] 12.2 Write integration tests
    - Test complete search flow from input to display
    - Test complete geolocation flow
    - Test error handling across components
    - _Requirements: All_
  
  - [ ] 12.3 Verify accessibility
    - Test keyboard navigation
    - Test screen reader announcements
    - Verify ARIA labels
    - Test focus management
    - _Requirements: 8.1_

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation with full test coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end flows
- All tests should use appropriate mocking (MSW for API, jest.fn() for browser APIs)
