// Location formatting and geocoding utilities

/**
 * Format coordinates to readable location string
 */
export const formatCoordinates = (latitude, longitude, precision = 4) => {
  if (!latitude || !longitude) return 'Unknown Location';
  
  const lat = parseFloat(latitude).toFixed(precision);
  const lng = parseFloat(longitude).toFixed(precision);
  
  const latDir = latitude >= 0 ? 'N' : 'S';
  const lngDir = longitude >= 0 ? 'E' : 'W';
  
  return `${Math.abs(lat)}°${latDir}, ${Math.abs(lng)}°${lngDir}`;
};

/**
 * Format location for display
 */
export const formatLocationDisplay = (location) => {
  if (!location) return 'Unknown Location';
  
  const parts = [];
  
  if (location.city) parts.push(location.city);
  if (location.country) parts.push(location.country);
  
  if (parts.length === 0 && location.latitude && location.longitude) {
    return formatCoordinates(location.latitude, location.longitude);
  }
  
  return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
};

/**
 * Get country flag emoji
 */
export const getCountryFlag = (countryName) => {
  const countryFlags = {
    'Nepal': '🇳🇵',
    'India': '🇮🇳',
    'United States': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Japan': '🇯🇵',
    'China': '🇨🇳',
    'South Korea': '🇰🇷',
    'Singapore': '🇸🇬',
    'Thailand': '🇹🇭',
    'Malaysia': '🇲🇾',
    'Indonesia': '🇮🇩',
    'Philippines': '🇵🇭',
    'Vietnam': '🇻🇳',
    'Bangladesh': '🇧🇩',
    'Pakistan': '🇵🇰',
    'Sri Lanka': '🇱🇰'
  };
  
  return countryFlags[countryName] || '🌍';
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  return distance;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 100) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
};

/**
 * Get location accuracy level
 */
export const getLocationAccuracy = (accuracy) => {
  if (!accuracy) return { level: 'unknown', color: 'gray', text: 'Unknown' };
  
  if (accuracy <= 10) {
    return { level: 'high', color: 'green', text: 'High Precision' };
  } else if (accuracy <= 100) {
    return { level: 'medium', color: 'yellow', text: 'Medium Precision' };
  } else {
    return { level: 'low', color: 'red', text: 'Low Precision' };
  }
};

/**
 * Generate location summary
 */
export const generateLocationSummary = (locations) => {
  if (!locations || locations.length === 0) {
    return {
      totalLocations: 0,
      countries: 0,
      cities: 0,
      mostActiveLocation: null
    };
  }
  
  const countries = new Set();
  const cities = new Set();
  let mostActiveLocation = null;
  let maxScans = 0;
  
  locations.forEach(location => {
    if (location.country) countries.add(location.country);
    if (location.city) cities.add(location.city);
    
    if (location.scanCount > maxScans) {
      maxScans = location.scanCount;
      mostActiveLocation = location;
    }
  });
  
  return {
    totalLocations: locations.length,
    countries: countries.size,
    cities: cities.size,
    mostActiveLocation
  };
};

/**
 * Mock reverse geocoding (in real app, use Google Maps API or similar)
 */
export const reverseGeocode = async (latitude, longitude) => {
  // This is a mock implementation
  // In production, you would call a real geocoding service
  
  try {
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock response based on coordinates
    if (latitude >= 27 && latitude <= 29 && longitude >= 83 && longitude <= 89) {
      return {
        country: 'Nepal',
        city: 'Kathmandu',
        region: 'Bagmati Province',
        formatted: 'Kathmandu, Nepal'
      };
    }
    
    return {
      country: 'Unknown',
      city: 'Unknown',
      region: 'Unknown',
      formatted: formatCoordinates(latitude, longitude)
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      country: 'Unknown',
      city: 'Unknown', 
      region: 'Unknown',
      formatted: formatCoordinates(latitude, longitude)
    };
  }
};

/**
 * Get timezone from coordinates (mock implementation)
 */
export const getTimezone = (latitude, longitude) => {
  // Mock implementation - in production use a real timezone API
  if (latitude >= 27 && latitude <= 29 && longitude >= 83 && longitude <= 89) {
    return 'Asia/Kathmandu';
  }
  return 'UTC';
};

export default {
  formatCoordinates,
  formatLocationDisplay,
  getCountryFlag,
  calculateDistance,
  formatDistance,
  getLocationAccuracy,
  generateLocationSummary,
  reverseGeocode,
  getTimezone
};