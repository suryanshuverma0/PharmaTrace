import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  TrendingUp, 
  Globe, 
  Shield, 
  AlertTriangle, 
  Clock, 
  Smartphone, 
  Monitor,
  Tablet,
  RefreshCw,
  Download,
  Filter,
  Eye
} from 'lucide-react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
} from 'chart.js';

import { trackingAnalyticsAPI } from '../../services/api/trackingAnalyticsAPI';
import { 
  formatLocationDisplay, 
  getCountryFlag, 
  formatCoordinates,
  getLocationAccuracy,
  generateLocationSummary
} from '../../services/locationFormatService';
import InteractiveMap from '../../components/maps/InteractiveMap';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const ProductVerificationTracking = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [realtimeData, setRealtimeData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshInterval = useRef(null);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setError(null);
      const [analytics, realtime, locations] = await Promise.all([
        trackingAnalyticsAPI.getAnalytics({ timeRange }),
        trackingAnalyticsAPI.getRealtimeVerifications(20),
        trackingAnalyticsAPI.getLocationDetails()
      ]);

      setAnalyticsData(analytics.data);
      setRealtimeData(realtime.data);
      setLocationData(locations.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    fetchAnalytics();

    if (autoRefresh) {
      refreshInterval.current = setInterval(fetchAnalytics, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [timeRange, autoRefresh]);

  // Chart configurations
  const timeSeriesChartConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Verification Trends',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const statusChartConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  // Prepare chart data
  const timeSeriesData = analyticsData?.timeSeriesData ? {
    labels: analyticsData.timeSeriesData.map(item => item._id.date),
    datasets: [
      {
        label: 'Total Scans',
        data: analyticsData.timeSeriesData.map(item => item.scans),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Authentic',
        data: analyticsData.timeSeriesData.map(item => item.authentic),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Counterfeit',
        data: analyticsData.timeSeriesData.map(item => item.counterfeit),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
    ],
  } : null;

  const deviceData = analyticsData?.deviceAnalytics ? {
    labels: analyticsData.deviceAnalytics.map(item => item._id || 'Unknown'),
    datasets: [
      {
        data: analyticsData.deviceAnalytics.map(item => item.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(168, 85, 247, 1)',
        ],
        borderWidth: 2,
      },
    ],
  } : null;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-lg text-gray-600">Loading analytics data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-6 text-center border border-red-200 bg-red-50 rounded-xl">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="mb-2 text-lg font-semibold text-red-800">Error Loading Analytics</h3>
          <p className="mb-4 text-red-600">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const overview = analyticsData?.overview || {};
  const locationSummary = generateLocationSummary(locationData);

  return (
    <div className="p-6 mx-auto space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Verification Tracking</h1>
          <p className="mt-1 text-gray-600">Real-time analytics and location insights</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Manual Refresh */}
          <button
            onClick={fetchAnalytics}
            className="p-2 text-blue-600 transition-colors bg-blue-100 rounded-lg hover:bg-blue-200"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Verifications"
          value={overview.totalScans?.toLocaleString() || '0'}
          icon={<Eye className="w-6 h-6" />}
          color="blue"
          change="+12.3%"
        />
        <StatCard
          title="Unique Products"
          value={overview.uniqueProductCount?.toLocaleString() || '0'}
          icon={<Shield className="w-6 h-6" />}
          color="green"
          change="+8.1%"
        />
        <StatCard
          title="Global Locations"
          value={locationSummary.countries}
          icon={<Globe className="w-6 h-6" />}
          color="purple"
          subtitle={`${locationSummary.totalLocations} cities`}
        />
        <StatCard
          title="Authentication Rate"
          value={`${overview.authenticationRate?.toFixed(1) || '0'}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="orange"
          change="+2.4%"
        />
      </div>
 {/* Interactive Map and Real-time Feed */}
      <div className="grid grid-cols-1 gap-6">
        {/* Interactive Real-time Map */}
        <div className="p-6 bg-white border shadow-sm lg:col-span-2 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Real-time Verification Map</h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {locationData.length} active locations
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">Live</span>
              </div>
            </div>
          </div>
          <div className="h-96">
            <InteractiveMap 
              locations={locationData}
              realtimeData={realtimeData}
              onLocationSelect={setSelectedLocation}
              selectedLocation={selectedLocation}
              autoRefresh={autoRefresh}
              showHeatmap={true}
            />
          </div>
        </div>

       
      </div>
      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Time Series Chart */}
        <div className="p-6 bg-white border shadow-sm rounded-xl">
          <h3 className="mb-4 text-lg font-semibold">Verification Trends</h3>
          <div className="h-64">
            {timeSeriesData && (
              <Line data={timeSeriesData} options={timeSeriesChartConfig} />
            )}
          </div>
        </div>

        {/* Device Analytics */}
        {/* <div className="p-6 bg-white border shadow-sm rounded-xl">
          <h3 className="mb-4 text-lg font-semibold">Device Distribution</h3>
          <div className="h-64">
            {deviceData && (
              <Doughnut data={deviceData} options={statusChartConfig} />
            )}
          </div>
        </div> */}
         {/* Real-time Feed */}
        <div className="p-6 bg-white border shadow-sm rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Live Verifications</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Live</span>
            </div>
          </div>
          <RealtimeFeed data={realtimeData} />
        </div>
      </div>

      {/* Product Analytics */}
      {/* {analyticsData?.productAnalytics && analyticsData.productAnalytics.length > 0 && (
        <div className="p-6 bg-white border shadow-sm rounded-xl">
          <h3 className="mb-4 text-lg font-semibold">Most Verified Products</h3>
          <ProductAnalyticsTable products={analyticsData.productAnalytics} />
        </div>
      )} */}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color, change, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-white border shadow-sm rounded-xl"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 ${colorClasses[color]} bg-opacity-10 rounded-lg`}>
          <div className={`text-${color}-600`}>{icon}</div>
        </div>
      </div>
      {change && (
        <div className="flex items-center mt-3">
          <span className="text-sm font-medium text-green-600">{change}</span>
          <span className="ml-1 text-sm text-gray-500">from last period</span>
        </div>
      )}
    </motion.div>
  );
};

// Location Heatmap Component
const LocationHeatmap = ({ locations, onLocationSelect }) => {
  return (
    <div className="space-y-3 overflow-y-auto max-h-80">
      {locations.map((location, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-3 transition-colors rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          onClick={() => onLocationSelect(location)}
        >
          <div className="flex items-center space-x-3">
            <div className="text-lg">
              {getCountryFlag(location.location?.country)}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {formatLocationDisplay(location.location)}
              </div>
              <div className="text-sm text-gray-500">
                {location.location?.coordinates ? 
                  formatCoordinates(
                    location.location.coordinates.latitude,
                    location.location.coordinates.longitude
                  ) : 'Unknown coordinates'
                }
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-blue-600">
              {location.stats?.totalVerifications || 0}
            </div>
            <div className="text-xs text-gray-500">
              {location.stats?.uniqueProducts || 0} products
            </div>
          </div>
        </motion.div>
      ))}
      
      {locations.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No location data available</p>
          <p className="mt-1 text-sm">Verifications will appear here once users scan your products</p>
        </div>
      )}
    </div>
  );
};

// Real-time Feed Component
const RealtimeFeed = ({ data }) => {
  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      case 'desktop': return <Monitor className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-orange-600 bg-orange-100';
      case 'counterfeit': return 'text-red-600 bg-red-100';
      case 'suspicious': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

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
    <div className="space-y-3 overflow-y-auto max-h-96">
      {data.map((verification, index) => (
        <motion.div
          key={verification._id || index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="p-3 transition-colors border border-gray-200 rounded-lg hover:border-gray-300"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              {getDeviceIcon(verification.deviceInfo?.deviceType)}
              <span className="text-sm font-medium text-gray-900 truncate">
                {verification.productName || verification.serialNumber}
              </span>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(verification.verificationResult?.status)}`}>
              {verification.verificationResult?.status || 'unknown'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <MapPin className="w-3 h-3" />
              <span>
                {formatLocationDisplay(verification.location) || 'Unknown location'}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(verification.scannedAt)}</span>
            </div>
          </div>
        </motion.div>
      ))}
      
      {data.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          <Clock className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No recent verifications</p>
          <p className="mt-1 text-xs">Real-time data will appear here</p>
        </div>
      )}
    </div>
  );
};

// Product Analytics Table
const ProductAnalyticsTable = ({ products }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
              Product
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
              Serial Number
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
              Verifications
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
              Global Reach
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
              Last Scanned
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product, index) => (
            <motion.tr
              key={product.serialNumber}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="hover:bg-gray-50"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {product.productName || 'Unknown Product'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-mono text-sm text-gray-500">
                  {product.serialNumber}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-blue-600">
                  {product.scanCount}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {product.globalReach} countries
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                {product.lastScanned ? 
                  new Date(product.lastScanned).toLocaleDateString() : 
                  'Never'
                }
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductVerificationTracking;