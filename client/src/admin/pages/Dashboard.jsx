import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, Factory, Truck, ClipboardList, Package, Shield, 
  TrendingUp, Activity, AlertTriangle, CheckCircle, 
  BarChart3, PieChart, Clock, MapPin, Zap, Globe, Eye
} from "lucide-react";
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { 
  getAllManufacturers, 
  getAllDistributors, 
  getAllPharmacists,
  getAdminAnalytics,
  getAdminRealtimeVerifications,
  getAdminLocationAnalytics,
  getAdminDashboardStats,
  getAdminRecentActivities,
  getAdminSystemAlerts
} from "../api/api";
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
  ArcElement
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalManufacturers: 0,
    totalDistributors: 0,
    totalPharmacists: 0,
    totalProducts: 0,
    totalBatches: 0,
    verifiedProducts: 0,
    totalVerifications: 0,
    authenticationRate: 0,
    systemHealth: 100,
  });

  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [realtimeData, setRealtimeData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const [
          manufacturers, 
          distributors, 
          pharmacists,
          dashboardStats,
          analytics,
          realtimeVerifications,
          locationAnalytics,
          activities,
          alerts
        ] = await Promise.all([
          getAllManufacturers(),
          getAllDistributors(),
          getAllPharmacists(),
          getAdminDashboardStats(),
          getAdminAnalytics(timeRange),
          getAdminRealtimeVerifications(10),
          getAdminLocationAnalytics(),
          getAdminRecentActivities(8),
          getAdminSystemAlerts()
        ]);

        setStats({
          totalUsers: manufacturers.length + distributors.length + pharmacists.length,
          totalManufacturers: manufacturers.length,
          totalDistributors: distributors.length,
          totalPharmacists: pharmacists.length,
          ...dashboardStats.data
        });

        setAnalyticsData(analytics.data);
        setRealtimeData(realtimeVerifications.data || []);
        setLocationData(locationAnalytics.data || []);
        setRecentActivities(activities);
        setSystemAlerts(alerts);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const primaryCards = [
    { 
      title: "Total Users", 
      value: stats.totalUsers, 
      icon: Users, 
      color: "from-blue-100 to-blue-50", 
      iconColor: "text-blue-600", 
      glow: "shadow-blue-200",
      trend: "+12%"
    },
    { 
      title: "Total Products", 
      value: stats.totalProducts, 
      icon: Package, 
      color: "from-purple-100 to-purple-50", 
      iconColor: "text-purple-600", 
      glow: "shadow-purple-200",
      trend: "+8%"
    },
    { 
      title: "Verifications", 
      value: stats.totalVerifications, 
      icon: Eye, 
      color: "from-green-100 to-green-50", 
      iconColor: "text-green-600", 
      glow: "shadow-green-200",
      trend: "+15%"
    },
    { 
      title: "Auth Rate", 
      value: `${stats.authenticationRate}%`, 
      icon: Shield, 
      color: "from-orange-100 to-orange-50", 
      iconColor: "text-orange-600", 
      glow: "shadow-orange-200",
      trend: "+2%"
    },
  ];

  const secondaryCards = [
    { title: "Manufacturers", value: stats.totalManufacturers, icon: Factory, color: "from-cyan-100 to-cyan-50", iconColor: "text-cyan-600" },
    { title: "Distributors", value: stats.totalDistributors, icon: Truck, color: "from-indigo-100 to-indigo-50", iconColor: "text-indigo-600" },
    { title: "Pharmacists", value: stats.totalPharmacists, icon: ClipboardList, color: "from-rose-100 to-rose-50", iconColor: "text-rose-600" },
    { title: "Total Batches", value: stats.totalBatches, icon: Package, color: "from-amber-100 to-amber-50", iconColor: "text-amber-600" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-20 h-20 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Comprehensive system overview and analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Primary Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {primaryCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className={`bg-gradient-to-br ${card.color} shadow-lg ${card.glow} rounded-2xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300`}
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl bg-white shadow-sm ${card.iconColor}`}>
                <card.icon size={28} />
              </div>
              {card.trend && (
                <span className="px-2 py-1 text-xs font-semibold text-green-600 bg-green-100 rounded-full">
                  {card.trend}
                </span>
              )}
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium tracking-wide text-gray-600 uppercase">{card.title}</h3>
              <p className="mt-2 text-3xl font-bold text-gray-800">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Secondary Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {secondaryCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-r ${card.color} rounded-xl p-4 border border-gray-100`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-white ${card.iconColor}`}>
                <card.icon size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-xl font-bold text-gray-800">{card.value.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analytics and Map Section */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Global Verification Map */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-white border border-gray-100 shadow-lg lg:col-span-2 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Global Verification Map</h2>
            <div className="flex items-center space-x-4">
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
              showHeatmap={true}
              autoRefresh={true}
            />
          </div>
        </motion.div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 bg-white border border-gray-100 shadow-lg rounded-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Recent Activities</h2>
            <Clock className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-4 overflow-y-auto max-h-80">
            {recentActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center p-3 space-x-3 transition-colors rounded-lg hover:bg-gray-50"
              >
                <div className={`p-2 rounded-lg ${
                  activity.type === 'product_registered' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'batch_shipped' ? 'bg-green-100 text-green-600' :
                  activity.type === 'verification' ? 'bg-purple-100 text-purple-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {activity.type === 'product_registered' ? <Package size={16} /> :
                   activity.type === 'batch_shipped' ? <Truck size={16} /> :
                   activity.type === 'verification' ? <Shield size={16} /> :
                   <Users size={16} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
