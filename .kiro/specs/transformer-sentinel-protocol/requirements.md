# Requirements Document

## Introduction

The Transformer Sentinel Protocol is a grid-resilience middleware system that prevents distribution transformer failure caused by simultaneous Electric Vehicle (EV) charging. The system uses a Thermal Digital Twin to calculate real-time grid health and provides intelligent charging slot recommendations based on thermal capacity rather than simple availability.

## Glossary

- **Thermal_Digital_Twin**: A real-time computational model that simulates transformer temperature based on current load, ambient conditions, and thermal physics
- **Grid_Health**: A calculated metric representing the thermal stress level of a distribution transformer (Green/Yellow/Red status)
- **Thermal_Capacity**: The remaining heat dissipation capability of a transformer before reaching critical temperature limits
- **Slot_Score**: A composite metric combining distance convenience and thermal availability for charging station recommendations
- **Top_Oil_Temperature_Model**: The IEC 60076-7 standard physics model for calculating transformer oil temperature
- **Sentinel_Engine**: The core backend system that performs thermal calculations and booking validation
- **Station_Discovery**: The process of finding and ranking nearby charging stations based on grid-aware criteria
- **Booking_System**: The reservation system that validates and confirms charging slots based on thermal constraints
- **Dashboard**: The technical monitoring interface for real-time grid health visualization
- **Map_Interface**: The user-facing interactive map showing charging stations with grid health indicators

## Requirements

### Requirement 1: Station Discovery and Grid Health Analysis

**User Story:** As an EV driver, I want to discover nearby charging stations with real-time grid health information, so that I can make informed decisions about where to charge without causing grid instability.

#### Acceptance Criteria

1. WHEN a user enters their destination and energy requirement, THE Station_Discovery SHALL return charging stations within reasonable driving distance
2. WHEN displaying charging stations, THE Map_Interface SHALL show each station colored by Grid_Health status (Green/Yellow/Red)
3. WHEN calculating Grid_Health, THE Thermal_Digital_Twin SHALL use the Top_Oil_Temperature_Model with current load, ambient temperature, and existing bookings
4. WHEN a station's projected temperature exceeds 110°C, THE System SHALL mark it as Red status and deprioritize it in recommendations
5. WHEN multiple stations are available, THE System SHALL rank them using Slot_Score combining distance and thermal availability

### Requirement 2: Thermal Capacity Reservation System

**User Story:** As a grid operator, I want the system to reserve thermal capacity when bookings are made, so that transformer overheating is prevented through proactive load management.

#### Acceptance Criteria

1. WHEN a user requests a charging slot, THE Sentinel_Engine SHALL simulate the thermal impact using existing load plus the new request
2. WHEN the projected temperature would exceed safe limits, THE Booking_System SHALL reject the request and suggest alternatives
3. WHEN a booking is confirmed, THE System SHALL reserve the corresponding thermal capacity in the Thermal_Digital_Twin
4. WHEN calculating thermal impact, THE System SHALL use deterministic physics from the Top_Oil_Temperature_Model rather than AI predictions
5. WHEN ambient temperature changes, THE System SHALL recalculate all thermal projections using current weather data

### Requirement 3: Real-time Transformer Temperature Monitoring

**User Story:** As a system administrator, I want continuous monitoring of transformer temperatures, so that I can track grid health and validate the thermal model accuracy.

#### Acceptance Criteria

1. THE Dashboard SHALL display real-time transformer temperature data for all monitored stations
2. WHEN load conditions change, THE Thermal_Digital_Twin SHALL update temperature projections within 30 seconds
3. WHEN displaying temperature trends, THE Dashboard SHALL show historical data and projected future temperatures
4. THE System SHALL log all thermal calculations and booking decisions for audit purposes
5. WHEN temperature approaches critical thresholds, THE Dashboard SHALL provide visual warnings and alerts

### Requirement 4: Conflict Detection and Alternative Suggestions

**User Story:** As an EV driver, I want the system to suggest alternatives when my preferred charging time would cause grid stress, so that I can still charge my vehicle while supporting grid stability.

#### Acceptance Criteria

1. WHEN a booking request would cause thermal violations, THE System SHALL return a 409 Conflict status with explanation
2. WHEN conflicts occur, THE System SHALL suggest alternative charging stations within acceptable distance
3. WHEN time-based conflicts exist, THE System SHALL suggest alternative time slots at the same station
4. WHEN power-based conflicts exist, THE System SHALL suggest reduced charging rates that would be thermally acceptable
5. WHEN no alternatives exist, THE System SHALL provide clear explanation and estimated wait times

### Requirement 5: Interactive Map with Grid-Aware Visualization

**User Story:** As an EV driver, I want an interactive map showing charging stations with visual grid health indicators, so that I can easily understand which stations are optimal for grid-friendly charging.

#### Acceptance Criteria

1. THE Map_Interface SHALL display charging stations using OpenStreetMap with Leaflet integration
2. WHEN showing station markers, THE System SHALL color-code them based on current Grid_Health (Green/Yellow/Red)
3. WHEN a user clicks a station marker, THE System SHALL display detailed information including thermal status and availability
4. THE Map_Interface SHALL provide routing information using OSRM for driving directions to selected stations
5. WHEN grid conditions change, THE Map_Interface SHALL update station colors in real-time without requiring page refresh

### Requirement 6: Booking System with Thermal Validation

**User Story:** As an EV driver, I want to book charging slots that are validated against thermal limits, so that my reservation is guaranteed and won't contribute to grid instability.

#### Acceptance Criteria

1. WHEN creating a booking, THE Booking_System SHALL validate thermal capacity before confirmation
2. WHEN a booking is confirmed, THE System SHALL persist it to the database with thermal reservation details
3. WHEN displaying booking confirmations, THE System SHALL show the thermal impact and projected grid health
4. THE Booking_System SHALL prevent double-booking of thermal capacity across overlapping time periods
5. WHEN bookings are cancelled, THE System SHALL immediately release the reserved thermal capacity

### Requirement 7: Data Integration and External API Management

**User Story:** As a system operator, I want reliable integration with external data sources, so that the thermal calculations are based on accurate real-world conditions.

#### Acceptance Criteria

1. THE System SHALL integrate with Open Charge Map API to obtain charging station locations and specifications
2. THE System SHALL integrate with OpenWeatherMap API to obtain ambient temperature data for thermal calculations
3. THE System SHALL integrate with DistanceMatrix.ai API to calculate driving distances and times
4. WHEN external APIs are unavailable, THE System SHALL use cached data and provide degraded service notifications
5. THE System SHALL cache weather data for 30 minutes to minimize API calls and improve performance

### Requirement 8: Database Management and Data Persistence

**User Story:** As a system administrator, I want reliable data storage for stations, bookings, and grid metrics, so that the system maintains state consistency and provides audit trails.

#### Acceptance Criteria

1. THE System SHALL store charging station data including location, transformer rating, and current load in PostgreSQL database
2. THE System SHALL store booking records with station ID, time windows, and expected energy consumption
3. THE System SHALL maintain time-series logs of transformer temperatures and grid metrics
4. THE System SHALL ensure ACID transaction compliance for all booking operations to prevent race conditions
5. THE System SHALL provide database backup and recovery mechanisms for operational continuity

### Requirement 9: Technical Dashboard for System Monitoring

**User Story:** As a grid operator, I want a comprehensive technical dashboard, so that I can monitor system performance and validate thermal model accuracy in real-time.

#### Acceptance Criteria

1. THE Dashboard SHALL display real-time thermal data for all transformers using Streamlit interface
2. THE Dashboard SHALL show booking activity and thermal capacity utilization across all stations
3. THE Dashboard SHALL provide visualization of temperature trends and thermal model predictions
4. THE Dashboard SHALL display system health metrics including API response times and data freshness
5. THE Dashboard SHALL allow operators to simulate "what-if" scenarios for load planning

### Requirement 10: System Performance and Reliability

**User Story:** As a system user, I want fast and reliable system responses, so that I can efficiently plan my charging activities without delays or failures.

#### Acceptance Criteria

1. THE System SHALL respond to station discovery requests within 2 seconds under normal load
2. THE System SHALL process booking requests within 3 seconds including thermal validation
3. THE System SHALL maintain 99.5% uptime during operational hours
4. THE System SHALL handle concurrent booking requests without data corruption or race conditions
5. WHEN system components fail, THE System SHALL provide graceful degradation and clear error messages