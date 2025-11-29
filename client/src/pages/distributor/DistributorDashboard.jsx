import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PackageCheck,
  Truck,
  CheckCircle,
  Warehouse,
  Share,
  History,
  TrendingUp,
  Box,
  AlertTriangle,
  Plus,
  ArrowRight,
  Building2,
  Mail,
  Phone,
  FileText
} from 'lucide-react';
import Alert from '../../components/UI/Alert';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api/api';

const DistributorDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    totalBatches: 0,
    totalInTransit: 0,
    totalDelivered: 0,
    totalInventory: 0,
    recentBatches: [],
  });
  const [distributorData, setDistributorData] = useState(null);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Mock pharmacy list - Replace with actual data from smart contract
  const pharmacies = [
    { value: '0x123...', label: 'Pharmacy A' },
    { value: '0x456...', label: 'Pharmacy B' },
    { value: '0x789...', label: 'Pharmacy C' },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, profileResponse, productsRes, batchesRes, inventoryRes, transfersRes] = await Promise.all([
        apiClient.get('/distributor/dashboard').catch(() => ({ data: {} })),
        apiClient.get('/distributor/profile').catch(() => ({ data: {} })),
        apiClient.get('/distributer/products').catch(() => ({ data: { products: [] } })),
        apiClient.get('/distributer/batches').catch(() => ({ data: { batches: [] } })),
        apiClient.get('/distributer/inventory').catch(() => ({ data: { inventory: [] } })),
        apiClient.get('/distributer/transfers').catch(() => ({ data: { transfers: [] } }))
      ]);

      setDashboardData({
        totalProducts: dashboardResponse.data.totalProducts || productsRes.data.products?.length || 0,
        totalBatches: dashboardResponse.data.totalBatches || batchesRes.data.batches?.length || 0,
        totalInTransit: dashboardResponse.data.totalInTransit || batchesRes.data.batches?.filter(b => b.status === 'In Transit')?.length || 0,
        totalDelivered: dashboardResponse.data.totalDelivered || batchesRes.data.batches?.filter(b => b.status === 'Delivered')?.length || 0,
        totalInventory: dashboardResponse.data.totalInventory || inventoryRes.data.inventory?.reduce((acc, i) => acc + (i.quantity || 0), 0) || 0,
        recentBatches: dashboardResponse.data.recentBatches || batchesRes.data.batches?.slice(0, 3) || [],
      });

      setDistributorData(profileResponse.data);
      setProducts(productsRes.data.products || []);
      setBatches(batchesRes.data.batches || []);
      setInventory(inventoryRes.data.inventory || []);
      setTransfers(transfersRes.data.transfers || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
      setNotification({ show: true, message: 'Failed to fetch dashboard data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Deprecated: fetchProducts is now handled in fetchDashboardData

  const handleReceiveProduct = async (serialNumber) => {
    try {
      await apiClient.post(`/distributor/receive`, { serialNumber });
      setNotification({
        show: true,
        message: 'Product received successfully',
        type: 'success',
      });
      fetchDashboardData();
    } catch (error) {
      setNotification({
        show: true,
        message: error?.response?.data?.message || 'Failed to receive product',
        type: 'error',
      });
    }
  };

  const handleShipToPharmacy = async (serialNumber) => {
    if (!selectedPharmacy) {
      setNotification({
        show: true,
        message: 'Please select a pharmacy',
        type: 'error',
      });
      return;
    }
    try {
      await apiClient.post(`/distributor/ship`, { serialNumber, pharmacy: selectedPharmacy });
      setNotification({
        show: true,
        message: 'Product shipped successfully',
        type: 'success',
      });
      fetchDashboardData();
    } catch (error) {
      setNotification({
        show: true,
        message: error?.response?.data?.message || 'Failed to ship product',
        type: 'error',
      });
    }
  };

  const handleTrackProduct = (serialNumber) => {
    navigate(`/distributor/track?serial=${serialNumber}`);
  };

  const handleVerifyProduct = () => {
    navigate('/distributor/verify');
  };

  // Enhanced stats with meaningful data
  const stats = [
    { 
      label: 'Total Products',
      value: dashboardData.totalProducts.toLocaleString(),
      change: dashboardData.totalProducts > 0 ? '+8.3%' : '0%',
      trend: dashboardData.totalProducts > 0 ? 'up' : 'neutral',
      icon: <Box className="w-6 h-6" />,
      color: 'blue'
    },
    { 
      label: 'Assigned Batches',
      value: dashboardData.totalBatches.toLocaleString(),
      change: dashboardData.totalBatches > 0 ? '+4.2%' : '0%',
      trend: dashboardData.totalBatches > 0 ? 'up' : 'neutral',
      icon: <PackageCheck className="w-6 h-6" />,
      color: 'purple'
    },
    { 
      label: 'In Transit',
      value: dashboardData.totalInTransit.toLocaleString(),
      change: dashboardData.totalInTransit > 0 ? 'Active' : 'None',
      trend: dashboardData.totalInTransit > 0 ? 'up' : 'neutral',
      icon: <Truck className="w-6 h-6" />,
      color: 'amber'
    },
    { 
      label: 'Delivered',
      value: dashboardData.totalDelivered.toLocaleString(),
      change: dashboardData.totalDelivered > 0 ? '+6.7%' : '0%',
      trend: dashboardData.totalDelivered > 0 ? 'up' : 'neutral',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'emerald'
    },
    { 
      label: 'Inventory',
      value: dashboardData.totalInventory.toLocaleString(),
      change: dashboardData.totalInventory > 0 ? 'Available' : 'Empty',
      trend: dashboardData.totalInventory > 0 ? 'up' : 'warning',
      icon: <Warehouse className="w-6 h-6" />,
      color: dashboardData.totalInventory > 0 ? 'indigo' : 'gray'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-gray-900">
              <span className='text-2xl font-semibold text-gray-700'>Welcome Back,</span> <br></br> {
                distributorData?.companyName || 
                distributorData?.name || 
                distributorData?.distributorName || 
                user?.name || 
                user?.companyName || 
                'Distributor'
              }
            </h2>
            <div className="space-y-1">
              <p className="text-lg text-gray-600">
                Here's your distribution and supply chain overview
              </p>
              {(distributorData || user) && (
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                  {(distributorData?.address || user?.address) && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {distributorData?.address || user?.address}
                    </span>
                  )}
                  {(distributorData?.email || user?.email) && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {distributorData?.email || user?.email}
                    </span>
                  )}
                  {(distributorData?.phoneNumber || user?.phoneNumber) && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {distributorData?.phoneNumber || user?.phoneNumber}
                    </span>
                  )}
                  {(distributorData?.licenseNumber || user?.licenseNumber) && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      License: {distributorData?.licenseNumber || user?.licenseNumber}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              to="/distributor/acknowledge-shipment"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5 mr-2" />
              Acknowledge Shipment
            </Link>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification.show && (
        <div className="mx-6 mb-6">
          <Alert
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification({ show: false })}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 mx-6 mb-6 text-red-800 bg-red-100 rounded-xl">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="h-8 mb-2 bg-gray-200 rounded w-96"></div>
                <div className="h-6 mb-4 bg-gray-200 rounded w-80"></div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <div className="w-32 h-4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <div className="w-40 h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="w-48 h-12 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="mx-6 mb-8">
            <div className="grid grid-cols-1 gap-6 mb-6 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="p-4 bg-white border shadow-lg rounded-2xl border-gray-200/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                    <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-16 h-8 bg-gray-200 rounded"></div>
                    <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Stats Row Skeleton */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-4 bg-white border rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-200 rounded-lg w-9 h-9"></div>
                    <div className="space-y-2">
                      <div className="w-16 h-5 bg-gray-200 rounded"></div>
                      <div className="w-20 h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions & Recent Batches Skeleton */}
          <div className="grid grid-cols-1 gap-8 mx-6 lg:grid-cols-3">
            {/* Quick Actions Skeleton */}
            <div className="space-y-6 lg:col-span-1">
              <div className="p-6 bg-white border shadow-lg rounded-2xl border-gray-200/50">
                <div className="w-32 h-6 mb-4 bg-gray-200 rounded"></div>
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center w-full p-4 border bg-gray-50 rounded-xl">
                      <div className="bg-gray-200 rounded-lg w-9 h-9"></div>
                      <div className="flex-1 ml-4 space-y-2">
                        <div className="w-24 h-4 bg-gray-200 rounded"></div>
                        <div className="w-32 h-3 bg-gray-200 rounded"></div>
                      </div>
                      <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Batches Skeleton */}
            <div className="space-y-6 lg:col-span-2">
              <div className="p-6 bg-white border shadow-lg rounded-2xl border-gray-200/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-32 h-6 bg-gray-200 rounded"></div>
                  <div className="w-20 h-8 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="p-4 border bg-white/50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                          <div className="space-y-2">
                            <div className="w-32 h-5 bg-gray-200 rounded"></div>
                            <div className="flex gap-4">
                              <div className="w-20 h-3 bg-gray-200 rounded"></div>
                              <div className="w-16 h-3 bg-gray-200 rounded"></div>
                              <div className="w-24 h-3 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
                          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {!loading && (
        <div className="mx-6 mb-8">
          <div className="grid grid-cols-1 gap-6 mb-6 sm:grid-cols-2 lg:grid-cols-5">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-white border shadow-lg rounded-2xl border-gray-200/50"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl bg-${stat.color}-100`}>
                    <div className={`text-${stat.color}-600`}>{stat.icon}</div>
                  </div>
                  <span className={`px-2.5 py-1 text-sm rounded-full ${
                    stat.trend === 'up' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : stat.trend === 'warning'
                      ? 'bg-amber-100 text-amber-800'
                      : stat.trend === 'down'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions & Recent Batches */}
      {!loading && (
        <div className="grid grid-cols-1 gap-8 mx-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="space-y-6 lg:col-span-1">
            <div className="p-6 bg-white border shadow-lg rounded-2xl border-gray-200/50">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/distributor/assigned-batches"
                  className="flex items-center w-full p-4 transition-all duration-200 border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 group"
                >
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <PackageCheck className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 ml-4 text-left">
                    <p className="font-medium text-gray-900">View Assigned Batches</p>
                    <p className="text-sm text-gray-600">Manage your assigned inventory</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 transition-colors group-hover:text-gray-600" />
                </Link>

                <Link
                  to="/distributor/acknowledge-shipment"
                  className="flex items-center w-full p-4 transition-all duration-200 border bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 rounded-xl hover:from-emerald-100 hover:to-teal-100 group"
                >
                  <div className="p-2 rounded-lg bg-emerald-500">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 ml-4 text-left">
                    <p className="font-medium text-gray-900">Acknowledge Shipment</p>
                    <p className="text-sm text-gray-600">Confirm received shipments</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 transition-colors group-hover:text-gray-600" />
                </Link>

                <Link
                  to="/distributor/distribute"
                  className="flex items-center w-full p-4 transition-all duration-200 border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 group"
                >
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Share className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 ml-4 text-left">
                    <p className="font-medium text-gray-900">Distribute Products</p>
                    <p className="text-sm text-gray-600">Ship to pharmacies</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 transition-colors group-hover:text-gray-600" />
                </Link>

                <Link
                  to="/distributor/inventory"
                  className="flex items-center w-full p-4 transition-all duration-200 border border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl hover:from-orange-100 hover:to-yellow-100 group"
                >
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Warehouse className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 ml-4 text-left">
                    <p className="font-medium text-gray-900">Inventory Management</p>
                    <p className="text-sm text-gray-600">View current stock levels</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 transition-colors group-hover:text-gray-600" />
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Batches */}
          <div className="lg:col-span-2">
            <div className="p-6 bg-white border shadow-lg rounded-2xl border-gray-200/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Assigned Batches</h3>
                <Link
                  to="/distributor/assigned-batches"
                  className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {dashboardData.recentBatches?.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No recent batches found.
                  </div>
                )}
                {dashboardData.recentBatches?.map((batch, index) => (
                  <motion.div
                    key={batch._id || batch.batchId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 transition-all duration-200 border rounded-xl border-gray-200/50 hover:border-blue-200 hover:shadow-md bg-white/50 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                          <PackageCheck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Batch: {batch.batchNumber || batch.batchId}
                          </h4>
                          <div className="flex flex-wrap gap-4">
                            <p className="text-sm text-gray-500">
                              Product: {batch.product || 'Unknown Product'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Quantity: {batch.quantity || batch.remainingQuantity || 0}
                            </p>
                            <p className="text-sm text-gray-500">
                              Assigned: {batch.totalAssignedToDistributor || batch.totalAssigned || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 text-sm rounded-full ${
                          batch.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : batch.status === 'In Transit'
                            ? 'bg-amber-100 text-amber-800'
                            : batch.status === 'Received'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {batch.status || 'Unknown'}
                        </span>
                        <Link
                          to={`/distributor/assigned-batches`}
                          className="p-2 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributorDashboard;
