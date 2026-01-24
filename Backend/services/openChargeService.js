const axios = require('axios');
const NodeCache = require('node-cache');

// Cache for 5 minutes (300 seconds)
const cache = new NodeCache({ stdTTL: 300 });

const OPENCHARGE_API_KEY = process.env.OPENCHARGE_API_KEY;
const OPENCHARGE_BASE_URL = process.env.OPENCHARGE_BASE_URL || 'https://api.openchargemap.io/v3';

class OpenChargeService {
  /**
   * Get nearby charging stations by coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radius - Radius in km (default: 10)
   * @param {number} maxResults - Maximum results (default: 50)
   */
  async getStationsByLocation(lat, lng, radius = 100, maxResults = 50) {
    const cacheKey = `stations_${lat}_${lng}_${radius}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('Returning cached station data');
      return cached;
    }

    try {
      const response = await axios.get(`${OPENCHARGE_BASE_URL}/poi/`, {
        params: {
          key: OPENCHARGE_API_KEY,
          latitude: lat,
          longitude: lng,
          distance: radius,
          distanceunit: 'KM',
          maxresults: maxResults,
          compact: false,
          verbose: false
        },
        timeout: 10000 // 10 second timeout
      });

      const stations = this.formatStations(response.data);
      
      // Cache the results
      cache.set(cacheKey, stations);
      
      return stations;
    } catch (error) {
      console.error('OpenCharge API error:', error.message);
      
      // Retry once on failure
      if (error.response?.status >= 500) {
        console.log('Retrying OpenCharge API request...');
        await this.delay(1000);
        return this.getStationsByLocation(lat, lng, radius, maxResults);
      }
      
      throw new Error(`Failed to fetch stations: ${error.message}`);
    }
  }

  /**
   * Get detailed information for a specific station
   * @param {number} stationId - OpenCharge station ID
   */
  async getStationDetails(stationId) {
    const cacheKey = `station_${stationId}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('Returning cached station details');
      return cached;
    }

    try {
      const response = await axios.get(`${OPENCHARGE_BASE_URL}/poi/`, {
        params: {
          key: OPENCHARGE_API_KEY,
          chargepointid: stationId,
          compact: false,
          verbose: true
        },
        timeout: 10000
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('Station not found');
      }

      const details = this.formatStationDetails(response.data[0]);
      
      // Cache the results
      cache.set(cacheKey, details);
      
      return details;
    } catch (error) {
      console.error('OpenCharge API error:', error.message);
      
      // Retry once on failure
      if (error.response?.status >= 500) {
        console.log('Retrying OpenCharge API request...');
        await this.delay(1000);
        return this.getStationDetails(stationId);
      }
      
      throw new Error(`Failed to fetch station details: ${error.message}`);
    }
  }

  /**
   * Get nearby stations by city name
   * @param {string} cityName - City name (e.g., "Bangalore")
   * @param {number} maxResults - Maximum results (default: 50)
   */
  async getNearbyStations(cityName, maxResults = 50) {
    const cacheKey = `city_${cityName}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('Returning cached city station data');
      return cached;
    }

    try {
      // First, geocode the city name to get coordinates
      const coordinates = await this.geocodeCity(cityName);
      
      // Then fetch stations near those coordinates
      const stations = await this.getStationsByLocation(
        coordinates.lat,
        coordinates.lng,
        20, // 20km radius for city search
        maxResults
      );
      
      // Cache the results
      cache.set(cacheKey, stations);
      
      return stations;
    } catch (error) {
      console.error('Error fetching stations by city:', error.message);
      throw new Error(`Failed to fetch stations for ${cityName}: ${error.message}`);
    }
  }

  /**
   * Get station power capacity (for scheduling)
   * @param {number} stationId - OpenCharge station ID
   */
  async getStationCapacity(stationId) {
    const details = await this.getStationDetails(stationId);
    
    return {
      stationId: details.stationId,
      maxPowerKW: details.maxPowerKW,
      connectors: details.totalConnectors,
      availableConnectors: details.connections.length,
      fastChargingAvailable: details.maxPowerKW >= 50
    };
  }

  /**
   * Format raw OpenCharge station data
   */
  formatStations(rawData) {
    return rawData.map(station => ({
      stationId: station.ID,
      name: station.AddressInfo?.Title || 'Unnamed Station',
      lat: station.AddressInfo?.Latitude,
      lng: station.AddressInfo?.Longitude,
      address: this.formatAddress(station.AddressInfo),
      connectors: station.Connections?.length || 0,
      maxPowerKW: this.getMaxPower(station.Connections),
      status: station.StatusType?.Title || 'Unknown',
      operatorName: station.OperatorInfo?.Title || 'Unknown',
      usageCost: station.UsageCost || 'Not specified',
      distance: station.AddressInfo?.Distance ? 
        `${station.AddressInfo.Distance.toFixed(2)} km` : null
    }));
  }

  /**
   * Format detailed station information
   */
  formatStationDetails(station) {
    const connections = station.Connections || [];
    
    return {
      stationId: station.ID,
      name: station.AddressInfo?.Title || 'Unnamed Station',
      lat: station.AddressInfo?.Latitude,
      lng: station.AddressInfo?.Longitude,
      address: this.formatAddress(station.AddressInfo),
      fullAddress: {
        addressLine1: station.AddressInfo?.AddressLine1,
        town: station.AddressInfo?.Town,
        stateOrProvince: station.AddressInfo?.StateOrProvince,
        postcode: station.AddressInfo?.Postcode,
        country: station.AddressInfo?.Country?.Title
      },
      totalConnectors: connections.length,
      connections: connections.map(conn => ({
        id: conn.ID,
        type: conn.ConnectionType?.Title || 'Unknown',
        powerKW: conn.PowerKW || 0,
        currentType: conn.CurrentType?.Title || 'Unknown',
        level: conn.Level?.Title || 'Unknown',
        quantity: conn.Quantity || 1
      })),
      maxPowerKW: this.getMaxPower(connections),
      status: station.StatusType?.Title || 'Unknown',
      operatorName: station.OperatorInfo?.Title || 'Unknown',
      operatorWebsite: station.OperatorInfo?.WebsiteURL,
      usageCost: station.UsageCost || 'Not specified',
      accessComments: station.AddressInfo?.AccessComments,
      numberOfPoints: station.NumberOfPoints || connections.length,
      generalComments: station.GeneralComments,
      dateLastConfirmed: station.DateLastConfirmed
    };
  }

  /**
   * Format address from AddressInfo
   */
  formatAddress(addressInfo) {
    if (!addressInfo) return 'Address not available';
    
    const parts = [
      addressInfo.AddressLine1,
      addressInfo.Town,
      addressInfo.StateOrProvince,
      addressInfo.Postcode
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  /**
   * Get maximum power from connections
   */
  getMaxPower(connections) {
    if (!connections || connections.length === 0) return 0;
    
    const powers = connections
      .map(conn => conn.PowerKW || 0)
      .filter(power => power > 0);
    
    return powers.length > 0 ? Math.max(...powers) : 0;
  }

  /**
   * Geocode city name to coordinates
   * Using OpenCharge's country/region search as fallback
   */
  async geocodeCity(cityName) {
    // Predefined coordinates for major Indian cities
    const cityCoordinates = {
      'bangalore': { lat: 12.9716, lng: 77.5946 },
      'bengaluru': { lat: 12.9716, lng: 77.5946 },
      'mumbai': { lat: 19.0760, lng: 72.8777 },
      'delhi': { lat: 28.7041, lng: 77.1025 },
      'chennai': { lat: 13.0827, lng: 80.2707 },
      'hyderabad': { lat: 17.3850, lng: 78.4867 },
      'pune': { lat: 18.5204, lng: 73.8567 },
      'kolkata': { lat: 22.5726, lng: 88.3639 },
      'ahmedabad': { lat: 23.0225, lng: 72.5714 },
      'jaipur': { lat: 26.9124, lng: 75.7873 }
    };

    const normalizedCity = cityName.toLowerCase().trim();
    
    if (cityCoordinates[normalizedCity]) {
      return cityCoordinates[normalizedCity];
    }

    // Default to Bangalore if city not found
    console.warn(`City ${cityName} not found, defaulting to Bangalore`);
    return cityCoordinates['bangalore'];
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    cache.flushAll();
    console.log('OpenCharge cache cleared');
  }

  /**
   * Delay helper for retries
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate station has required capacity for scheduling
   */
  async validateStationForScheduling(stationId, requiredPowerKW) {
    try {
      const capacity = await this.getStationCapacity(stationId);
      
      return {
        valid: capacity.maxPowerKW >= requiredPowerKW && capacity.connectors > 0,
        capacity,
        reason: capacity.maxPowerKW < requiredPowerKW ? 
          'Insufficient power capacity' : 
          capacity.connectors === 0 ? 
          'No connectors available' : 
          'Valid'
      };
    } catch (error) {
      return {
        valid: false,
        reason: `Station validation failed: ${error.message}`
      };
    }
  }
}

module.exports = new OpenChargeService();
