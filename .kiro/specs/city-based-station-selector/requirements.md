# Requirements Document

## Introduction

This document specifies the requirements for adding a city selector feature to the NearbyStationsPanel component. The feature enables users to select from a list of predefined Indian cities and view EV charging stations specific to that city. The implementation uses hardcoded location data (latitude/longitude coordinates) and transforms it into the existing Station interface format for display.

## Glossary

- **NearbyStationsPanel**: The React component that displays a list of EV charging stations
- **Station**: A data structure representing an EV charging station with properties: id, name, lat, lng, status, load, temp, address
- **City_Selector**: A dropdown UI component that allows users to choose from predefined cities
- **Location_Data**: Hardcoded coordinate data for EV stations organized by city
- **Station_Transformer**: Logic that converts raw coordinate data into Station interface format
- **City**: A predefined location with a name, center coordinates (lat/lng), and associated station coordinates

## Requirements

### Requirement 1: City Selection Interface

**User Story:** As a user, I want to select a city from a dropdown menu, so that I can view EV charging stations in that specific city.

#### Acceptance Criteria

1. WHEN the NearbyStationsPanel component loads, THE City_Selector SHALL display a dropdown at the top of the panel
2. WHEN the dropdown is clicked, THE City_Selector SHALL display all available cities (Delhi, Gurugram, Noida, Mumbai, Navi Mumbai, Pune, Bengaluru, Chennai, Hyderabad, Ahmedabad, Kolkata)
3. WHEN a city is selected, THE City_Selector SHALL update the displayed station list to show only stations from that city
4. THE City_Selector SHALL use Tailwind CSS styling consistent with the existing slate/blue theme
5. WHEN no city is selected initially, THE City_Selector SHALL display a default placeholder text

### Requirement 2: Location Data Storage

**User Story:** As a developer, I want location data stored in a structured format, so that it can be easily maintained and accessed.

#### Acceptance Criteria

1. THE Location_Data SHALL be stored in a dedicated TypeScript data file
2. THE Location_Data SHALL include all 11 cities with their center coordinates and station coordinates
3. WHEN accessing location data, THE System SHALL provide type-safe access to city information
4. THE Location_Data SHALL organize stations by city for efficient filtering
5. THE Location_Data SHALL include the following cities with station counts: Delhi (74), Gurugram (75), Noida (74), Mumbai (6), Navi Mumbai (6), Pune (4), Bengaluru (220), Chennai (19), Hyderabad (6), Ahmedabad (17), Kolkata (11)

### Requirement 3: Station Data Transformation

**User Story:** As a developer, I want coordinate data transformed into the Station interface, so that it integrates seamlessly with existing components.

#### Acceptance Criteria

1. WHEN transforming location data, THE Station_Transformer SHALL generate a unique station ID for each coordinate pair
2. WHEN transforming location data, THE Station_Transformer SHALL assign realistic status values ('safe', 'warning', or 'critical')
3. WHEN transforming location data, THE Station_Transformer SHALL generate load percentages between 0-100
4. WHEN transforming location data, THE Station_Transformer SHALL generate temperature values in Celsius between 40-110 degrees
5. WHEN transforming location data, THE Station_Transformer SHALL create descriptive station names based on city and index
6. WHEN transforming location data, THE Station_Transformer SHALL generate addresses that include the city name
7. THE Station_Transformer SHALL preserve the original latitude and longitude coordinates

### Requirement 4: Station Filtering

**User Story:** As a user, I want to see only stations from my selected city, so that I can focus on relevant charging locations.

#### Acceptance Criteria

1. WHEN a city is selected, THE System SHALL filter stations to include only those from the selected city
2. WHEN the filtered station list is displayed, THE System SHALL maintain the existing station card layout and styling
3. WHEN no city is selected, THE System SHALL display an empty list or a prompt to select a city
4. WHEN switching between cities, THE System SHALL update the station list immediately without delay

### Requirement 5: Component Integration

**User Story:** As a developer, I want the city selector integrated into the existing component, so that it maintains current functionality.

#### Acceptance Criteria

1. WHEN the city selector is added, THE NearbyStationsPanel SHALL preserve all existing props (selectedStationId, onSelectStation, onNavigate)
2. WHEN a station is selected, THE System SHALL continue to call the onSelectStation callback with the station ID and data
3. WHEN the navigate button is clicked, THE System SHALL continue to call the onNavigate callback with coordinates
4. THE NearbyStationsPanel SHALL maintain its existing visual styling and layout
5. WHEN displaying stations, THE System SHALL continue to show all station metrics (status, load, temperature, slots)

### Requirement 6: Data Generation Logic

**User Story:** As a developer, I want consistent and realistic generated data, so that the demo appears professional.

#### Acceptance Criteria

1. WHEN generating station status, THE Station_Transformer SHALL distribute statuses with approximately 60% safe, 30% warning, 10% critical
2. WHEN generating load values, THE Station_Transformer SHALL create values that correlate with status (safe: 0-70%, warning: 70-90%, critical: 90-100%)
3. WHEN generating temperature values, THE Station_Transformer SHALL create values that correlate with load (higher load = higher temperature)
4. WHEN generating station names, THE Station_Transformer SHALL create unique names within each city
5. WHEN generating addresses, THE Station_Transformer SHALL include the city name and a descriptive location identifier
