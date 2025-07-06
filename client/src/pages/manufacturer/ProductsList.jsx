import React, { useState, useEffect, useCallback } from 'react';
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
import apiClient from '../../services/api/api';

const ProductsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Options for the Select component
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'manufactured', label: 'Manufactured' },
    { value: 'in-transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' }
  ];

  // Fetch registered products from the backend
  const getRegisteredProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/products/registered-product');
      // Normalize status values to use hyphens
      const normalizedProducts = response.data.map(product => ({
        ...product,
        status: product.status.replace(/\s+/g, '-').toLowerCase()
      }));
      setProducts(normalizedProducts);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch products on component mount
  useEffect(() => {
    getRegisteredProducts();
  }, []);

  // Filter products based on productName and status
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
    const matchesFilter = filterStatus === 'all' || product.status === filterStatus;
    console.log('Filtering:', { product, searchTerm, filterStatus, matchesSearch, matchesFilter });
    return matchesSearch && matchesFilter;
  });

  // Debounce search input to improve performance
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Handle search input change with debouncing
  const handleSearchChange = useCallback(
    debounce((value) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'manufactured':
      case 'produced':
        return 'bg-blue-100 text-blue-800';
      case 'in-transit':
        return 'bg-amber-100 text-amber-800';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Registered Products</h1>
        <p className="mt-2 text-lg text-gray-600">
          View and manage all your registered pharmaceutical products
        </p>
      </div>

      {/* Filters and Search */}
      <div className="grid gap-4 mb-6 md:flex md:items-center md:justify-between">
        <div className="flex items-center justify-between flex-1 gap-4">
      
          <Select
            options={statusOptions}
            value={filterStatus}
            onChange={setFilterStatus}
            className="w-40 h-10 text-sm border-gray-300 rounded-lg"
            icon={<Filter className="w-5 h-5" />}
            placeholder="Select status"
          />
        </div>
        <Button
          variant="secondary"
          className="flex items-center h-10 gap-2 text-sm border-gray-300 rounded-lg"
        >
          <Download className="w-5 h-5" />
          Export
        </Button>
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <p className="text-gray-600">No products found.</p>
        ) : (
          filteredProducts.map((product) => (
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
                      <div className="flex flex-wrap text-sm text-gray-500 gap-x-4 gap-y-1">
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
                  <span>Product in transit to distribution center - ETA: 2 days</span>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductsList;