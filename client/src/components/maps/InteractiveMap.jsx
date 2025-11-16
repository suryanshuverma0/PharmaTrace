import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Eye, 
  Shield, 
  AlertTriangle, 
  Clock, 
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { 
  formatLocationDisplay, 
  getCountryFlag, 
  formatCoordinates,
  reverseGeocode 
} from '../../services/locationFormatService';

// Fix Leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for different verification types
const createCustomIcon = (status, count) => {
  const getColor = () => {
    switch (status) {
      case 'verified': return '#10B981'; // Green
      case 'expired': return '#F59E0B'; // Orange  
      case 'counterfeit': return '#EF4444'; // Red
      case 'suspicious': return '#F59E0B'; // Orange
      default: return '#6B7280'; // Gray
    }
  };

  const color = getColor();
  const size = Math.min(Math.max(20 + (count * 2), 25), 50); // Scale based on count

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${Math.min(size / 3, 14)}px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      ">
        ${count}
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      </style>
    `,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// Component to handle map updates
const MapUpdater = ({ locations, selectedLocation, onLocationSelect }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      // Create bounds to fit all markers
      const bounds = L.latLngBounds();
      locations.forEach(location => {
        if (location.location?.coordinates) {
          bounds.extend([
            location.location.coordinates.latitude,
            location.location.coordinates.longitude
          ]);
        }
      });
      
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [locations, map]);

  useEffect(() => {
    if (selectedLocation?.location?.coordinates) {
      map.setView([
        selectedLocation.location.coordinates.latitude,
        selectedLocation.location.coordinates.longitude
      ], 12);
    }
  }, [selectedLocation, map]);

  return null;
};

// Verification status pill component
const StatusPill = ({ status, count }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return { color: 'bg-green-100 text-green-800', icon: <Shield className="w-3 h-3" /> };
      case 'expired':
        return { color: 'bg-orange-100 text-orange-800', icon: <Clock className="w-3 h-3" /> };
      case 'counterfeit':
        return { color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="w-3 h-3" /> };
      case 'suspicious':
        return { color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="w-3 h-3" /> };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: <Eye className="w-3 h-3" /> };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon}
      <span className="ml-1 capitalize">{status}: {count}</span>
    </span>
  );
};

// Device type icon
const DeviceIcon = ({ deviceType }) => {
  switch (deviceType?.toLowerCase()) {
    case 'mobile':
      return <Smartphone className="w-4 h-4 text-blue-500" />;
    case 'tablet':
      return <Tablet className="w-4 h-4 text-green-500" />;
    case 'desktop':
      return <Monitor className="w-4 h-4 text-purple-500" />;
    default:
      return <Monitor className="w-4 h-4 text-gray-500" />;
  }
};

const InteractiveMap = ({ 
  locations = [], 
  realtimeData = [], 
  onLocationSelect,
  selectedLocation,
  autoRefresh = true,
  showHeatmap = true 
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [enhancedLocations, setEnhancedLocations] = useState([]);
  const [geocodingCache, setGeocodingCache] = useState(new Map());
  const [isGeocoding, setIsGeocoding] = useState(false);
  const mapRef = useRef(null);

  // Default center (Nepal coordinates as fallback)
  const defaultCenter = [27.7172, 85.3240];
  const defaultZoom = 7;

  // Enhance locations with reverse geocoding
  useEffect(() => {
    const enhanceLocations = async () => {
      if (locations.length === 0) {
        setEnhancedLocations([]);
        return;
      }

      setIsGeocoding(true);
      const enhanced = await Promise.all(
        locations.map(async (location) => {
          const coords = location.location?.coordinates;
          if (!coords || !coords.latitude || !coords.longitude) return location;

          const cacheKey = `${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`;
          
          if (geocodingCache.has(cacheKey)) {
            const cachedLocation = geocodingCache.get(cacheKey);
            return {
              ...location,
              location: {
                ...location.location,
                ...cachedLocation
              }
            };
          }

          try {
            const geocodingResult = await reverseGeocode(coords.latitude, coords.longitude);
            const enhancedLocation = {
              ...location,
              location: {
                ...location.location,
                city: geocodingResult.city,
                country: geocodingResult.country,
                region: geocodingResult.region,
                formatted: geocodingResult.formatted,
                fullAddress: geocodingResult.fullAddress
              }
            };

            // Cache the result
            setGeocodingCache(prev => new Map(prev).set(cacheKey, {
              city: geocodingResult.city,
              country: geocodingResult.country,
              region: geocodingResult.region,
              formatted: geocodingResult.formatted,
              fullAddress: geocodingResult.fullAddress
            }));

            return enhancedLocation;
          } catch (error) {
            console.error('Error enhancing location:', error);
            return location;
          }
        })
      );

      setEnhancedLocations(enhanced);
      setIsGeocoding(false);
    };

    enhanceLocations();
  }, [locations, geocodingCache]);

  // Get map center based on enhanced data
  const getMapCenter = () => {
    const locationsToUse = enhancedLocations.length > 0 ? enhancedLocations : locations;
    if (locationsToUse.length > 0 && locationsToUse[0].location?.coordinates) {
      return [
        locationsToUse[0].location.coordinates.latitude,
        locationsToUse[0].location.coordinates.longitude
      ];
    }
    return defaultCenter;
  };

  // Process locations for map display
  const processedLocations = (enhancedLocations.length > 0 ? enhancedLocations : locations).map((location, index) => {
    const coords = location.location?.coordinates;
    if (!coords || !coords.latitude || !coords.longitude) return null;

    // Determine primary status for marker color
    const statusBreakdown = location.stats?.statusBreakdown || [];
    const primaryStatus = statusBreakdown.length > 0 ? statusBreakdown[0] : 'verified';
    const totalVerifications = location.stats?.totalVerifications || 1;

    return {
      id: index,
      position: [coords.latitude, coords.longitude],
      data: location,
      status: primaryStatus,
      count: totalVerifications
    };
  }).filter(Boolean);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const scanTime = new Date(date);
    const diffMs = now - scanTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-100 rounded-lg overflow-hidden">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        <div className="p-2 rounded-lg shadow-lg bg-white/90 backdrop-blur-sm">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Tracking</span>
          </div>
        </div>
        {locations.length > 0 && (
          <div className="p-2 rounded-lg shadow-lg bg-white/90 backdrop-blur-sm">
            <div className="text-sm font-medium text-gray-700">
              {locations.length} Location{locations.length !== 1 ? 's' : ''}
            </div>
            <div className="text-xs text-gray-500">
              {locations.reduce((sum, loc) => sum + (loc.stats?.totalVerifications || 0), 0)} Verifications
            </div>
            {isGeocoding && (
              <div className="flex items-center mt-1 space-x-1 text-xs text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Resolving locations...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <div className="p-3 rounded-lg shadow-lg bg-white/90 backdrop-blur-sm">
          <div className="mb-2 text-sm font-medium text-gray-700">Verification Status</div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Verified</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Expired</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Counterfeit</span>
            </div>
          </div>
        </div>
      </div>

      <MapContainer
        center={getMapCenter()}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        whenCreated={() => setMapReady(true)}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapUpdater 
          locations={processedLocations} 
          selectedLocation={selectedLocation}
          onLocationSelect={onLocationSelect}
        />

        {/* Location Markers */}
        {processedLocations.map((location) => (
          <Marker
            key={location.id}
            position={location.position}
            icon={createCustomIcon(location.status, location.count)}
            eventHandlers={{
              click: () => onLocationSelect?.(location.data)
            }}
          >
            <Popup 
              className="custom-popup"
              maxWidth={300}
            >
              <div className="p-2">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {getCountryFlag(location.data.location?.country)}
                    </span>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {formatLocationDisplay(location.data.location) || 'Unknown Location'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatCoordinates(
                          location.data.location?.coordinates?.latitude,
                          location.data.location?.coordinates?.longitude
                        )}
                      </div>
                    </div>
                  </div>
                  <MapPin className="w-4 h-4 text-gray-400" />
                </div>

                {/* Stats */}
                <div className="mb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Verifications</span>
                    <span className="font-semibold text-blue-600">
                      {location.data.stats?.totalVerifications || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Unique Products</span>
                    <span className="font-semibold text-gray-700">
                      {location.data.stats?.uniqueProducts || 0}
                    </span>
                  </div>
                  {location.data.stats?.lastVerification && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Scan</span>
                      <span className="text-sm text-gray-500">
                        {formatTimeAgo(location.data.stats.lastVerification)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Breakdown */}
                {location.data.stats?.statusBreakdown && (
                  <div className="mb-3">
                    <div className="mb-2 text-sm font-medium text-gray-700">Verification Status</div>
                    <div className="flex flex-wrap gap-1">
                      {location.data.stats.statusBreakdown.map((status, idx) => (
                        <StatusPill 
                          key={idx} 
                          status={status} 
                          count={location.data.stats.statusCounts?.[status] || 1}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Device Breakdown */}
                {location.data.stats?.deviceBreakdown && (
                  <div>
                    <div className="mb-2 text-sm font-medium text-gray-700">Devices Used</div>
                    <div className="flex items-center space-x-3">
                      {location.data.stats.deviceBreakdown.map((device, idx) => (
                        <div key={idx} className="flex items-center space-x-1">
                          <DeviceIcon deviceType={device} />
                          <span className="text-xs text-gray-600 capitalize">{device}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* No data state */}
      {locations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-700">No Verification Data</h3>
            <p className="mb-4 text-gray-500">
              Product verifications will appear on the map once users scan your products
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
              <span>Waiting for verification data...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;