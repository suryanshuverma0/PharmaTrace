import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search,
  Filter,
  Download,
  Box,
  Route,
  QrCode,
  MoreVertical,
  Calendar,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { Select } from '../../components/UI/Select';

const ProductsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Sample data
  const products = [
    {
      id: 1,
      name: "Amoxicillin 500mg",
      serialNumber: "AMX500-B247",
      batchNumber: "B247",
      manufactureDate: "2025-06-01",
      expiryDate: "2027-06-01",
      location: "Boston, USA",
      status: "manufactured"
    },
    {
      id: 2,
      name: "Lisinopril 10mg",
      serialNumber: "LSP010-B123",
      batchNumber: "B123",
      manufactureDate: "2025-06-01",
      expiryDate: "2027-06-01",
      location: "Chicago, USA",
      status: "in-transit"
    },
    {
      id: 3,
      name: "Metformin 850mg",
      serialNumber: "MTF850-B789",
      batchNumber: "B789",
      manufactureDate: "2025-05-30",
      expiryDate: "2027-05-30",
      location: "New York, USA",
      status: "delivered"
    },
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || product.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'manufactured':
        return 'bg-blue-100 text-blue-800';
      case 'in-transit':
        return 'bg-amber-100 text-amber-800';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Registered Products</h1>
        <p className="mt-2 text-lg text-gray-600">
          View and manage all your registered pharmaceutical products
        </p>
      </div>

      {/* Filters and Search */}
      <div className="grid gap-4 mb-6 md:flex md:items-center md:justify-between">
        <div className="flex items-center flex-1 gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-5 h-5" />}
              className="max-w-md"
            />
          </div>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-40"
            icon={<Filter className="w-5 h-5" />}
          >
            <option value="all">All Status</option>
            <option value="manufactured">Manufactured</option>
            <option value="in-transit">In Transit</option>
            <option value="delivered">Delivered</option>
          </Select>
        </div>
        <Button
          variant="secondary"
          className="flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Export
        </Button>
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {filteredProducts.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 transition-all duration-200 bg-white border shadow-md rounded-2xl border-gray-200/50 hover:shadow-lg"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap">
              {/* Product Info */}
              <div className="flex items-start flex-1 gap-4">
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl">
                  <Box className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {product.name}
                  </h3>
                  <div className="mt-1 space-y-1">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>SN: {product.serialNumber}</span>
                      <span>Batch: {product.batchNumber}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Mfg: {product.manufactureDate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{product.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 ml-auto">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(product.status)}`}>
                  {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                </span>
                <div className="flex items-center -mr-2 gap-0.5">
                  <button className="p-2 text-gray-400 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50">
                    <QrCode className="w-5 h-5" />
                  </button>
                  <Link
                    to={`/manufacturer/track/${product.serialNumber}`}
                    className="p-2 text-gray-400 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50"
                  >
                    <Route className="w-5 h-5" />
                  </Link>
                  <button className="p-2 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-50">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {product.status === 'in-transit' && (
              <div className="flex items-center gap-2 px-4 py-3 mt-4 text-sm text-amber-700 bg-amber-50 rounded-xl">
                <AlertCircle className="w-5 h-5" />
                <span>Product in transit to Chicago Distribution Center - ETA: 2 days</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProductsList;
