import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { FaWarehouse, FaSearch, FaArrowLeft, FaBox, FaCalendarAlt, FaFilter, FaTimes, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { pharmacyAPI } from '../../services/api/pharmacyAPI';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('receivedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({
    expiryStatus: 'all', // all, critical, warning, normal
    manufacturer: 'all',
    distributor: 'all',
    quantityRange: 'all', // all, low, medium, high
    dateRange: 'all', // all, week, month, quarter, year
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await pharmacyAPI.getInventory();
      
      if (response.success) {
        setInventory(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to fetch inventory');
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return { status: 'expired', color: 'text-red-700 font-bold', bgColor: 'bg-red-100 border-red-300' };
    if (diffDays <= 7) return { status: 'critical', color: 'text-red-600 font-bold', bgColor: 'bg-red-50 border-red-200' };
    if (diffDays <= 30) return { status: 'warning', color: 'text-yellow-600 font-semibold', bgColor: 'bg-yellow-50 border-yellow-200' };
    return { status: 'normal', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' };
  };

  const getQuantityCategory = (quantity) => {
    if (quantity <= 50) return 'low';
    if (quantity <= 200) return 'medium';
    return 'high';
  };

  const getDateCategory = (date) => {
    const today = new Date();
    const itemDate = new Date(date);
    const diffTime = today - itemDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return 'week';
    if (diffDays <= 30) return 'month';
    if (diffDays <= 90) return 'quarter';
    return 'year';
  };

  // Get unique values for filter dropdowns
  const uniqueManufacturers = useMemo(() => 
    [...new Set(inventory.map(item => item.manufacturer).filter(Boolean))].sort(),
    [inventory]
  );

  const uniqueDistributors = useMemo(() => 
    [...new Set(inventory.map(item => item.distributor).filter(Boolean))].sort(),
    [inventory]
  );

  // Enhanced filtering and sorting with useMemo for performance
  const filteredAndSortedInventory = useMemo(() => {
    let filtered = inventory.filter(item => {
      // Text search
      const searchLower = searchTerm.toLowerCase();
      const textMatch = 
        item.product.toLowerCase().includes(searchLower) ||
        item.batchId.toLowerCase().includes(searchLower) ||
        item.manufacturer.toLowerCase().includes(searchLower) ||
        item.distributor.toLowerCase().includes(searchLower);

      if (!textMatch) return false;

      // Expiry status filter
      if (filters.expiryStatus !== 'all') {
        const expiryStatus = getExpiryStatus(item.expiryDate);
        if (expiryStatus.status !== filters.expiryStatus) return false;
      }

      // Manufacturer filter
      if (filters.manufacturer !== 'all' && item.manufacturer !== filters.manufacturer) return false;

      // Distributor filter
      if (filters.distributor !== 'all' && item.distributor !== filters.distributor) return false;

      // Quantity range filter
      if (filters.quantityRange !== 'all') {
        const quantityCategory = getQuantityCategory(item.quantity);
        if (quantityCategory !== filters.quantityRange) return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const dateCategory = getDateCategory(item.receivedAt);
        if (dateCategory !== filters.dateRange) return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'receivedAt' || sortBy === 'expiryDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortBy === 'quantity') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [inventory, searchTerm, filters, sortBy, sortOrder]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      expiryStatus: 'all',
      manufacturer: 'all',
      distributor: 'all',
      quantityRange: 'all',
      dateRange: 'all',
    });
    setSortBy('receivedAt');
    setSortOrder('desc');
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="w-3 h-3 text-gray-400" />;
    return sortOrder === 'asc' 
      ? <FaSortUp className="w-3 h-3 text-blue-600" />
      : <FaSortDown className="w-3 h-3 text-blue-600" />;
  };

  const isFilterActive = () => {
    return searchTerm || 
           filters.expiryStatus !== 'all' || 
           filters.manufacturer !== 'all' || 
           filters.distributor !== 'all' || 
           filters.quantityRange !== 'all' || 
           filters.dateRange !== 'all';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <div className="w-64 h-8 mb-2 bg-gray-200 rounded"></div>
              <div className="w-48 h-5 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="text-right">
            <div className="w-20 h-4 mb-1 bg-gray-200 rounded"></div>
            <div className="w-16 h-8 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Search and Filters Skeleton */}
        <Card className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="w-full h-10 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-48 h-10 bg-gray-200 rounded-lg"></div>
              <div className="w-32 h-10 bg-gray-200 rounded-lg"></div>
              <div className="w-28 h-10 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </Card>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="ml-4 space-y-2">
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  <div className="w-16 h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Inventory List Skeleton */}
        <Card className="p-6">
          <div className="w-40 h-6 mb-4 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    <div className="space-y-1">
                      <div className="w-48 h-5 bg-gray-200 rounded"></div>
                      <div className="w-32 h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-1">
                      <div className="w-16 h-4 bg-gray-200 rounded"></div>
                      <div className="w-20 h-4 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
                <div className="pt-3 mt-3 border-t border-gray-200">
                  <div className="w-64 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <FaWarehouse className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Error Loading Inventory</h2>
        <p className="mb-4 text-gray-600">{error}</p>
        <Button onClick={fetchInventory}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="flex items-center text-2xl font-bold text-gray-900">
              Inventory Management
            </h1>
            <p className="text-gray-600">Manage your pharmacy inventory</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">{filteredAndSortedInventory.length}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Search by product, batch, manufacturer, distributor..."
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="receivedAt">Sort by Received Date</option>
              <option value="expiryDate">Sort by Expiry Date</option>
              <option value="product">Sort by Product Name</option>
              <option value="quantity">Sort by Quantity</option>
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
            >
              <FaFilter className="w-4 h-4" />
              {showAdvancedFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            {isFilterActive() && (
              <Button
                variant="outline"
                className="flex items-center gap-2 text-red-600 border-red-300"
                onClick={clearAllFilters}
              >
                <FaTimes className="w-4 h-4" />
                Clear All
              </Button>
            )}
          </div>
        </div>
        {showAdvancedFilters && (
          <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Expiry Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={filters.expiryStatus}
                onChange={(e) => handleFilterChange('expiryStatus', e.target.value)}
              >
                <option value="all">All</option>
                <option value="critical">Critical (≤7 days)</option>
                <option value="warning">Warning (≤30 days)</option>
                <option value="normal">Normal (&gt;30 days)</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Manufacturer</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={filters.manufacturer}
                onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
              >
                <option value="all">All</option>
                {uniqueManufacturers.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Distributor</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={filters.distributor}
                onChange={(e) => handleFilterChange('distributor', e.target.value)}
              >
                <option value="all">All</option>
                {uniqueDistributors.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Quantity Range</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={filters.quantityRange}
                onChange={(e) => handleFilterChange('quantityRange', e.target.value)}
              >
                <option value="all">All</option>
                <option value="low">Low (&le;50)</option>
                <option value="medium">Medium (&le;200)</option>
                <option value="high">High (&gt;200)</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Received Date</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <option value="all">All</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="quarter">Last 90 days</option>
                <option value="year">Older</option>
              </select>
            </div>
          </div>
        )}
        {/* Active filter chips */}
        {isFilterActive() && (
          <div className="flex flex-wrap gap-2 mt-3">
            {searchTerm && (
              <span className="px-3 py-1 text-xs text-green-800 bg-green-100 border border-green-200 rounded-full">Search: {searchTerm}</span>
            )}
            {filters.expiryStatus !== 'all' && (
              <span className="px-3 py-1 text-xs text-yellow-800 bg-yellow-100 border border-yellow-200 rounded-full">Expiry: {filters.expiryStatus}</span>
            )}
            {filters.manufacturer !== 'all' && (
              <span className="px-3 py-1 text-xs text-blue-800 bg-blue-100 border border-blue-200 rounded-full">Manufacturer: {filters.manufacturer}</span>
            )}
            {filters.distributor !== 'all' && (
              <span className="px-3 py-1 text-xs text-purple-800 bg-purple-100 border border-purple-200 rounded-full">Distributor: {filters.distributor}</span>
            )}
            {filters.quantityRange !== 'all' && (
              <span className="px-3 py-1 text-xs text-pink-800 bg-pink-100 border border-pink-200 rounded-full">Quantity: {filters.quantityRange}</span>
            )}
            {filters.dateRange !== 'all' && (
              <span className="px-3 py-1 text-xs text-gray-800 bg-gray-100 border border-gray-200 rounded-full">Date: {filters.dateRange}</span>
            )}
          </div>
        )}
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-white border shadow-lg rounded-2xl border-gray-200/50"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-100">
              <div className="text-blue-600"><FaBox className="w-6 h-6" /></div>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-900">{inventory.length}</h3>
            <p className="text-gray-600">Total Products</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-white border shadow-lg rounded-2xl border-gray-200/50"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-green-100">
              <div className="text-green-600"><FaWarehouse className="w-6 h-6" /></div>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-900">{inventory.reduce((sum, item) => sum + item.quantity, 0)}</h3>
            <p className="text-gray-600">Total Units</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 bg-white border shadow-lg rounded-2xl border-gray-200/50"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-yellow-100">
              <div className="text-yellow-600"><FaCalendarAlt className="w-6 h-6" /></div>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-900">
              {inventory.filter(item => {
                const diffDays = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                return diffDays <= 30;
              }).length}
            </h3>
            <p className="text-gray-600">Expiring Soon</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 bg-white border shadow-lg rounded-2xl border-gray-200/50"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-red-100">
              <div className="text-red-600"><FaFilter className="w-6 h-6" /></div>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-900">
              {inventory.filter(item => {
                const diffDays = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
              }).length}
            </h3>
            <p className="text-gray-600">Critical</p>
          </div>
        </motion.div>
      </div>

      {/* Inventory List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 bg-white border shadow-lg rounded-2xl border-gray-200/50"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Inventory Items</h2>
        
        {filteredAndSortedInventory.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <FaBox className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No Inventory Items</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'No items match your search criteria.' 
                : 'Your inventory is empty.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedInventory.map((item) => {
              const expiryStatus = getExpiryStatus(item.expiryDate);
              return (
                <div 
                  key={item.distributionId} 
                  className={`p-4 border rounded-lg ${expiryStatus.bgColor}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <FaBox className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.product}</h3>
                        <p className="text-sm text-gray-600">Batch: {item.batchId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                        expiryStatus.status === 'critical' 
                          ? 'bg-red-100 text-red-800' 
                          : expiryStatus.status === 'warning'
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {expiryStatus.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                    <div>
                      <span className="font-medium text-gray-600">Quantity:</span>
                      <p className="font-semibold text-gray-900">{item.quantity} units</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Expiry Date:</span>
                      <p className={expiryStatus.color}>
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Received:</span>
                      <p className="text-gray-900">
                        {new Date(item.receivedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Days Left:</span>
                      <p className={expiryStatus.color}>
                        {Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </div>

                  {item.distributor && (
                    <div className="pt-3 mt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Distributor:</span> {item.distributor}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Inventory;
