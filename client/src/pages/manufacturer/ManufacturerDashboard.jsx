import React from 'react';
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
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ManufacturerDashboard = () => {
  // Sample data
  const stats = [
    { 
      label: 'Total Products',
      value: '1,234',
      change: '+12.5%',
      trend: 'up',
      icon: <Boxes className="w-6 h-6" />,
      color: 'blue'
    },
    { 
      label: 'In Transit',
      value: '56',
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

  const recentProducts = [
    {
      name: "Amoxicillin 500mg",
      serialNumber: "AMX500-B247",
      batchNumber: "B247",
      manufactureDate: "2025-06-01",
      status: "manufactured"
    },
    {
      name: "Lisinopril 10mg",
      serialNumber: "LSP010-B123",
      batchNumber: "B123",
      manufactureDate: "2025-06-01",
      status: "in-transit"
    },
    {
      name: "Metformin 850mg",
      serialNumber: "MTF850-B789",
      batchNumber: "B789",
      manufactureDate: "2025-05-30",
      status: "delivered"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-gray-900">
              Welcome Back, PharmaCorp
            </h2>
            <p className="text-lg text-gray-600">
              Here's your manufacturing and supply chain overview
            </p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Quick Actions & Recent Products */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
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
            </div>
          </div>
        </div>

        {/* Recent Products */}
        <div className="lg:col-span-2">
          <div className="p-6 bg-white border shadow-lg rounded-2xl border-gray-200/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Products</h3>
              <Link
                to="/manufacturer/products"
                className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
              >
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {recentProducts.map((product, index) => (
                <motion.div
                  key={product.serialNumber}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 transition-all duration-200 border rounded-xl border-gray-200/50 hover:border-blue-200 hover:shadow-md bg-white/50 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                        <Box className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{product.name}</h4>
                        <div className="flex space-x-4">
                          <p className="text-sm text-gray-500">SN: {product.serialNumber}</p>
                          <p className="text-sm text-gray-500">Batch: {product.batchNumber}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 text-sm rounded-full ${
                        product.status === 'manufactured'
                          ? 'bg-blue-100 text-blue-800'
                          : product.status === 'in-transit'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                      </span>
                      <Link
                        to={`/manufacturer/track/${product.serialNumber}`}
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
    </div>
  );
};

export default ManufacturerDashboard;
