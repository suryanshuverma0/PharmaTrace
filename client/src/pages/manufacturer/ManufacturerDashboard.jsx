import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PackagePlus,
  Boxes,
  Route,
  QrCode,
  Search,
  TrendingUp,
  Box,
  Truck,
  CheckCircle,
  AlertTriangle,
  Plus,
  ArrowRight,
  Download,
  Printer,
  Building2,
  Mail,
  Phone,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api/api';

const ManufacturerDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    totalInTransit: 0,
    totalBatches: 0,
    recentBatches: [],
  });
  const [manufacturerData, setManufacturerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashboardResponse, profileResponse] = await Promise.all([
          apiClient.get('/manufacturer/dashboard'),
          apiClient.get('/manufacturer/profile')
        ]);

        setDashboardData({
          totalProducts: dashboardResponse.data.totalProducts,
          recentProducts: dashboardResponse.data.recentProducts,
          totalInTransit: dashboardResponse.data.totalInTransit || 0,
          recentBatches: dashboardResponse.data.recentBatches || [],
          totalBatches: dashboardResponse.data.recentBatches?.length || 0,
        });

        setManufacturerData(profileResponse.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Dummy data for other stats
  const stats = [
    { 
      label: 'Total Products',
      value: dashboardData.totalProducts.toLocaleString(),
      change: '+12.5%',
      trend: 'up',
      icon: <Boxes className="w-6 h-6" />,
      color: 'blue'
    },
    { 
      label: 'In Transit',
      value: dashboardData.totalInTransit.toLocaleString(),
      change: '+3.2%',
      trend: 'up',
      icon: <Truck className="w-6 h-6" />,
      color: 'indigo'
    },
    { 
      label: 'Verified',
      value: '892',
      change: '+8.1%',
      trend: 'up',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'emerald'
    },
    { 
      label: 'Issues Reported',
      value: '2',
      change: '-25%',
      trend: 'down',
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'amber'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-gray-900">
              <span className='text-2xl font-semibold text-gray-700'>Welcome Back,</span> <br></br> {manufacturerData?.companyName || 'Manufacturer'}
            </h2>
            <div className="space-y-1">
              <p className="text-lg text-gray-600">
                Here's your manufacturing and supply chain overview
              </p>
              {manufacturerData && (
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {manufacturerData.address}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {manufacturerData.email}
                  </span>
                  {manufacturerData.phoneNumber && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {manufacturerData.phoneNumber}
                    </span>
                  )}
                  {manufacturerData.licenseNumber && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      License: {manufacturerData.licenseNumber}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              to="/manufacturer/register"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5 mr-2" />
              Register New Product
            </Link>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 mx-6 mb-6 text-red-800 bg-red-100 rounded-xl">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="p-4 mx-6 mb-6 text-blue-800 bg-blue-100 rounded-xl">
          Loading dashboard data...
        </div>
      )}

      {/* Stats Grid */}
      {!loading && (
        <div className="grid grid-cols-1 gap-6 mx-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 bg-white border shadow-lg rounded-2xl border-gray-200/50"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                  <div className={`text-${stat.color}-600`}>{stat.icon}</div>
                </div>
                <span className={`px-2.5 py-1 text-sm rounded-full ${
                  stat.trend === 'up' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-red-100 text-red-800'
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
      )}

      {/* Quick Actions & Recent Products */}
      {!loading && (
        <div className="grid grid-cols-1 gap-8 mx-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="space-y-6 lg:col-span-1">
            <div className="p-6 bg-white border shadow-lg rounded-2xl border-gray-200/50">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/manufacturer/register"
                  className="flex items-center w-full p-4 transition-all duration-200 border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 group"
                >
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <PackagePlus className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 ml-4 text-left">
                    <p className="font-medium text-gray-900">Register Product</p>
                    <p className="text-sm text-gray-600">Add new product to blockchain</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 transition-colors group-hover:text-gray-600" />
                </Link>

                <Link
                  to="/manufacturer/track"
                  className="flex items-center w-full p-4 transition-all duration-200 border bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 rounded-xl hover:from-emerald-100 hover:to-teal-100 group"
                >
                  <div className="p-2 rounded-lg bg-emerald-500">
                    <Route className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 ml-4 text-left">
                    <p className="font-medium text-gray-900">Track Products</p>
                    <p className="text-sm text-gray-600">Monitor supply chain journey</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 transition-colors group-hover:text-gray-600" />
                </Link>

                <Link
                  to="/manufacturer/qr-codes"
                  className="flex items-center w-full p-4 transition-all duration-200 border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 group"
                >
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 ml-4 text-left">
                    <p className="font-medium text-gray-900">QR Codes</p>
                    <p className="text-sm text-gray-600">Generate & manage QR codes</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 transition-colors group-hover:text-gray-600" />
                </Link>

                <Link
                  to="/manufacturer/assign-batch"
                  className="flex items-center w-full p-4 transition-all duration-200 border border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl hover:from-orange-100 hover:to-yellow-100 group"
                >
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 ml-4 text-left">
                    <p className="font-medium text-gray-900">Assign Batch</p>
                    <p className="text-sm text-gray-600">Assign batch to distributor</p>
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
                <h3 className="text-lg font-semibold text-gray-900">Recent Batches</h3>
                <Link
                  to="/manufacturer/products"
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
                    key={batch._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 transition-all duration-200 border rounded-xl border-gray-200/50 hover:border-blue-200 hover:shadow-md bg-white/50 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                          <Boxes className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Batch: {batch.batchNumber}</h4>
                          <div className="flex flex-wrap gap-4">
                            <p className="text-sm text-gray-500">
                              Products: {batch.productsCount}/{batch.quantityProduced}
                            </p>
                            <p className="text-sm text-gray-500">
                              Available: {batch.quantityAvailable}
                            </p>
                            <p className="text-sm text-gray-500">
                              {batch.dosageForm} - {batch.strength}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 text-sm rounded-full ${
                          batch.shipmentStatus === 'Produced'
                            ? 'bg-blue-100 text-blue-800'
                            : batch.shipmentStatus === 'In Transit'
                            ? 'bg-amber-100 text-amber-800'
                            : batch.shipmentStatus === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : batch.shipmentStatus === 'Returned'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {batch.shipmentStatus}
                        </span>
                        <Link
                          to={`/manufacturer/batches/${batch._id}`}
                          className="p-2 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100"
                        >
                          <Route className="w-5 h-5" />
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

export default ManufacturerDashboard;