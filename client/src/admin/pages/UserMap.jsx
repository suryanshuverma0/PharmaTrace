import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Users, 
  Factory, 
  Truck, 
  Package, 
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  MoreHorizontal
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getUserMapData } from '../api/api';

// Fix Leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Nepal district coordinates - comprehensive list
const DISTRICT_COORDINATES = {
  // Province 1 (Koshi Province)
  'Taplejung': { lat: 27.3500, lng: 87.6667 },
  'Panchthar': { lat: 27.2000, lng: 87.8833 },
  'Ilam': { lat: 26.9167, lng: 87.9333 },
  'Jhapa': { lat: 26.6500, lng: 87.8167 },
  'Morang': { lat: 26.6500, lng: 87.2667 },
  'Sunsari': { lat: 26.6167, lng: 87.1833 },
  'Dhankuta': { lat: 26.9833, lng: 87.3500 },
  'Terhathum': { lat: 27.1167, lng: 87.4500 },
  'Sankhuwasabha': { lat: 27.6000, lng: 87.3000 },
  'Bhojpur': { lat: 27.1833, lng: 87.0500 },
  'Solukhumbu': { lat: 27.7333, lng: 86.7000 },
  'Okhaldhunga': { lat: 27.3167, lng: 86.5000 },
  'Khotang': { lat: 27.0333, lng: 86.8167 },
  'Udayapur': { lat: 26.8500, lng: 86.5500 },

  // Province 2 (Madhesh Province)
  'Saptari': { lat: 26.7667, lng: 86.9167 },
  'Siraha': { lat: 26.6667, lng: 86.2000 },
  'Dhanusha': { lat: 26.7500, lng: 86.0000 },
  'Mahottari': { lat: 27.0333, lng: 85.7500 },
  'Sarlahi': { lat: 27.0167, lng: 85.5500 },
  'Bara': { lat: 27.2167, lng: 84.9167 },
  'Parsa': { lat: 27.0500, lng: 84.9333 },
  'Rautahat': { lat: 27.1333, lng: 85.3833 },

  // Bagmati Province
  'Kathmandu': { lat: 27.7172, lng: 85.3240 },
  'Lalitpur': { lat: 27.6588, lng: 85.3247 },
  'Bhaktapur': { lat: 27.6710, lng: 85.4298 },
  'Kavrepalanchok': { lat: 27.6000, lng: 85.5833 },
  'Sindhupalchok': { lat: 27.9500, lng: 85.7000 },
  'Dolakha': { lat: 27.6667, lng: 86.1667 },
  'Ramechhap': { lat: 27.3333, lng: 86.0833 },
  'Sindhuli': { lat: 27.2500, lng: 85.9667 },
  'Chitwan': { lat: 27.5291, lng: 84.3542 },
  'Makwanpur': { lat: 27.4333, lng: 85.0333 },
  'Nuwakot': { lat: 27.9167, lng: 85.1667 },
  'Rasuwa': { lat: 28.1167, lng: 85.3333 },
  'Dhading': { lat: 27.8667, lng: 84.9000 },

  // Gandaki Province
  'Gorkha': { lat: 28.0000, lng: 84.6333 },
  'Lamjung': { lat: 28.2333, lng: 84.3833 },
  'Tanahun': { lat: 28.0000, lng: 84.2500 },
  'Kaski': { lat: 28.2096, lng: 83.9856 },
  'Syangja': { lat: 28.0833, lng: 83.8667 },
  'Parbat': { lat: 28.2333, lng: 83.6833 },
  'Baglung': { lat: 28.2667, lng: 83.5833 },
  'Myagdi': { lat: 28.6000, lng: 83.5833 },
  'Gulmi': { lat: 28.0833, lng: 83.2833 },
  'Arghakhanchi': { lat: 28.1167, lng: 83.1167 },
  'Nawalpur': { lat: 27.6333, lng: 84.1000 },

  // Lumbini Province
  'Kapilvastu': { lat: 27.5500, lng: 83.0500 },
  'Rupandehi': { lat: 27.6167, lng: 83.4667 },
  'Palpa': { lat: 27.8833, lng: 83.5833 },
  'Dang': { lat: 28.0833, lng: 82.3000 },
  'Pyuthan': { lat: 28.1000, lng: 82.8167 },
  'Rolpa': { lat: 28.3167, lng: 82.6333 },
  'Rukum East': { lat: 28.5833, lng: 82.5833 },
  'Banke': { lat: 28.1500, lng: 81.6000 },
  'Bardiya': { lat: 28.3333, lng: 81.4167 },
  'Parasi': { lat: 27.7000, lng: 83.6000 },
  'Rukum West': { lat: 28.5833, lng: 82.2833 },
  'Salyan': { lat: 28.3833, lng: 82.1667 },

  // Karnali Province
  'Dolpa': { lat: 29.2000, lng: 82.8000 },
  'Jumla': { lat: 29.2833, lng: 82.1833 },
  'Kalikot': { lat: 29.1167, lng: 81.2167 },
  'Mugu': { lat: 29.5000, lng: 82.1667 },
  'Humla': { lat: 30.1333, lng: 81.8000 },
  'Surkhet': { lat: 28.6000, lng: 81.6333 },
  'Dailekh': { lat: 28.8667, lng: 81.7167 },
  'Jajarkot': { lat: 28.7000, lng: 82.2000 },
  'Rukum': { lat: 28.5833, lng: 82.5833 },
  'Salyan': { lat: 28.3833, lng: 82.1667 },

  // Sudurpashchim Province
  'Bajura': { lat: 29.5833, lng: 81.6667 },
  'Bajhang': { lat: 29.5333, lng: 81.2000 },
  'Achham': { lat: 29.1167, lng: 81.2167 },
  'Doti': { lat: 29.2667, lng: 80.9833 },
  'Kailali': { lat: 28.7500, lng: 80.7500 },
  'Kanchanpur': { lat: 28.8833, lng: 80.2000 },
  'Dadeldhura': { lat: 29.3000, lng: 80.5833 },
  'Baitadi': { lat: 29.5333, lng: 80.4667 },
  'Darchula': { lat: 29.8500, lng: 80.5500 },

  // Additional major cities that might be used
  'Pokhara': { lat: 28.2096, lng: 83.9856 },
  'Biratnagar': { lat: 26.4525, lng: 87.2718 },
  'Birgunj': { lat: 27.0104, lng: 84.8808 },
  'Butwal': { lat: 27.7000, lng: 83.4667 },
  'Dharan': { lat: 26.8118, lng: 87.2845 },
  'Hetauda': { lat: 27.4285, lng: 85.0489 },
  'Janakpur': { lat: 26.7271, lng: 85.9246 },
  'Nepalgunj': { lat: 28.0506, lng: 81.6169 },
  'Dhangadhi': { lat: 28.6833, lng: 80.5833 },
  'Mahendranagar': { lat: 28.9644, lng: 80.1519 },
  'Damak': { lat: 26.6586, lng: 87.7025 },
  'Itahari': { lat: 26.6667, lng: 87.2833 }
};

// Custom marker icons for different user types
const createUserTypeIcon = (userType, count) => {
  const getConfig = () => {
    switch (userType) {
      case 'manufacturer': 
        return { color: '#3B82F6', letter: 'M', name: 'Manufacturer' }; // Blue
      case 'distributor': 
        return { color: '#F59E0B', letter: 'D', name: 'Distributor' }; // Orange
      case 'pharmacist': 
        return { color: '#10B981', letter: 'P', name: 'Pharmacist' }; // Green
      default: 
        return { color: '#6B7280', letter: '?', name: 'Unknown' }; // Gray
    }
  };

  const config = getConfig();
  const size = Math.min(Math.max(25 + (count * 2), 30), 50);

  return L.divIcon({
    html: `
      <div style="
        background-color: ${config.color};
        border: 3px solid white;
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: ${Math.max(12, size * 0.4)}px;
        color: white;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        ${config.letter}
      </div>
      <div style="
        position: absolute;
        top: ${size + 5}px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        white-space: nowrap;
        pointer-events: none;
      ">
        ${count} ${config.name}${count > 1 ? 's' : ''}
      </div>
    `,
    className: 'custom-user-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const UserMap = () => {
  const [users, setUsers] = useState({
    manufacturers: [],
    distributors: [],
    pharmacists: []
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    manufacturers: true,
    distributors: true,
    pharmacists: true
  });
  const [mapData, setMapData] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRegions: 0,
    activeRegions: 0
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    processMapData();
  }, [users, filters]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await getUserMapData();
      
      setUsers({
        manufacturers: response.data.manufacturers || [],
        distributors: response.data.distributors || [],
        pharmacists: response.data.pharmacists || []
      });
      
      // Update stats from the API response
      setStats({
        totalUsers: response.stats.totalUsers || 0,
        totalRegions: response.stats.totalRegions || 0,
        activeRegions: response.stats.activeRegions || 0
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMapData = () => {
    const regionUserMap = new Map();

    // Process each user type if filter is enabled
    if (filters.manufacturers) {
      users.manufacturers.forEach(user => {
        user.workingRegions?.forEach(region => {
          const key = `${region}_manufacturer`;
          if (!regionUserMap.has(key)) {
            regionUserMap.set(key, {
              region,
              userType: 'manufacturer',
              users: [],
              count: 0
            });
          }
          const data = regionUserMap.get(key);
          data.users.push(user);
          data.count++;
        });
      });
    }

    if (filters.distributors) {
      users.distributors.forEach(user => {
        user.workingRegions?.forEach(region => {
          const key = `${region}_distributor`;
          if (!regionUserMap.has(key)) {
            regionUserMap.set(key, {
              region,
              userType: 'distributor',
              users: [],
              count: 0
            });
          }
          const data = regionUserMap.get(key);
          data.users.push(user);
          data.count++;
        });
      });
    }

    if (filters.pharmacists) {
      users.pharmacists.forEach(user => {
        user.workingRegions?.forEach(region => {
          const key = `${region}_pharmacist`;
          if (!regionUserMap.has(key)) {
            regionUserMap.set(key, {
              region,
              userType: 'pharmacist',
              users: [],
              count: 0
            });
          }
          const data = regionUserMap.get(key);
          data.users.push(user);
          data.count++;
        });
      });
    }

    // Convert to array and add coordinates
    const processedData = Array.from(regionUserMap.values())
      .filter(data => DISTRICT_COORDINATES[data.region])
      .map(data => ({
        ...data,
        coordinates: DISTRICT_COORDINATES[data.region]
      }));

    setMapData(processedData);
  };

  const toggleFilter = (userType) => {
    setFilters(prev => ({
      ...prev,
      [userType]: !prev[userType]
    }));
  };

  const getUserStatusBadge = (user) => {
    const isApproved = user.isApproved;
    const isActive = user.isActive;
    
    if (isApproved && isActive) {
      return <span className="px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full">Active</span>;
    } else if (isApproved && !isActive) {
      return <span className="px-2 py-1 text-xs text-yellow-800 bg-yellow-100 rounded-full">Approved</span>;
    } else {
      return <span className="px-2 py-1 text-xs text-red-800 bg-red-100 rounded-full">Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="w-48 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-64 h-4 mt-2 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-12 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Map Container Skeleton */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Map Skeleton */}
          <div className="relative">
            <div className="w-full h-96 bg-gray-100 rounded-b-lg animate-pulse"></div>
            
            {/* Fake markers skeleton */}
            <div className="absolute top-16 left-20 w-6 h-6 bg-blue-200 rounded-full animate-pulse"></div>
            <div className="absolute top-32 left-40 w-6 h-6 bg-yellow-200 rounded-full animate-pulse"></div>
            <div className="absolute top-24 right-32 w-6 h-6 bg-green-200 rounded-full animate-pulse"></div>
            <div className="absolute bottom-16 left-1/3 w-6 h-6 bg-blue-200 rounded-full animate-pulse"></div>
            <div className="absolute bottom-24 right-20 w-6 h-6 bg-yellow-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Distribution Map</h1>
          <p className="mt-1 text-sm text-gray-500">
            Visualize registered users across Nepal districts
          </p>
        </div>
        <button
          onClick={fetchUserData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Regions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeRegions}</p>
            </div>
            <MapPin className="w-8 h-8 text-green-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Coverage</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalRegions > 0 ? Math.round((stats.activeRegions / stats.totalRegions) * 100) : 0}%
              </p>
            </div>
            <Eye className="w-8 h-8 text-purple-600" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
      >
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter by User Type:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleFilter('manufacturers')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                filters.manufacturers
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <Factory className="w-4 h-4" />
              Manufacturers ({users.manufacturers.length})
              {filters.manufacturers ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => toggleFilter('distributors')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                filters.distributors
                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <Truck className="w-4 h-4" />
              Distributors ({users.distributors.length})
              {filters.distributors ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => toggleFilter('pharmacists')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                filters.pharmacists
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <Package className="w-4 h-4" />
              Pharmacists ({users.pharmacists.length})
              {filters.pharmacists ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white border border-gray-200 rounded-lg shadow-sm"
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Nepal User Distribution</h2>
          <p className="text-sm text-gray-500">
            {mapData.length} active locations displayed
          </p>
        </div>
        <div className="h-[600px] rounded-b-lg overflow-hidden">
          <MapContainer
            center={[28.3949, 84.1240]} // Nepal center
            zoom={7}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {mapData.map((data, index) => (
              <Marker
                key={`${data.region}-${data.userType}-${index}`}
                position={[data.coordinates.lat, data.coordinates.lng]}
                icon={createUserTypeIcon(data.userType, data.count)}
              >
                <Popup className="custom-popup" maxWidth={300}>
                  <div className="p-2">
                    <h3 className="font-semibold text-gray-900">{data.region}</h3>
                    <div className="space-y-2 overflow-y-auto max-h-40">
                      {data.users.map((user, userIndex) => (
                        <div key={userIndex} className="p-2 mt-2 text-xs bg-gray-100 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">
                              {user.companyName || user.name}
                            </span>
                            {getUserStatusBadge(user)}
                          </div>
                          
                          {/* Wallet Address */}
                          <div className="mb-1">
                            <span className="font-medium text-gray-600">Wallet:</span>
                            <p className="font-mono text-xs text-gray-800 break-all">
                              {user.address}
                            </p>
                          </div>
                          
                          {/* User Name (if different from company name) */}
                          {user.companyName && user.name && user.name !== user.companyName && (
                            <div className="mb-1">
                              <span className="font-medium text-gray-600">Contact:</span>
                              <span className="ml-1 text-gray-800">{user.name}</span>
                            </div>
                          )}
                          
                          {/* Email */}
                          {user.email && (
                            <div className="mb-1">
                              <span className="font-medium text-gray-600">Email:</span>
                              <span className="ml-1 text-gray-800">{user.email}</span>
                            </div>
                          )}
                          
                          {/* Phone */}
                          {user.phone && (
                            <div className="mb-1">
                              <span className="font-medium text-gray-600">Phone:</span>
                              <span className="ml-1 text-gray-800">{user.phone}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </motion.div>
    </div>
  );
};

export default UserMap;