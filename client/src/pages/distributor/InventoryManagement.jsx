import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../../components/UI/Input';
import { Card } from '../../components/UI/Card';
import { Search, AlertCircle, Loader2, LayoutGrid, Table2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import apiClient from '../../services/api/api';

const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    return format(new Date(date), 'MMM dd, yyyy');
  } catch {
    return 'N/A';
  }
};

const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/distributer/inventory');
      const inventoryData = res.data.inventory || [];

      const enrichedInventory = inventoryData.map(item => {
        // Backwards compatibility mapping
        const totalAssigned = item.totalAssignedToDistributor ?? item.total ?? item.quantity;
        const shippedOut = item.shippedOutByDistributor ?? 0;
        const available = item.quantity; // already remaining for distributor
        return {
          ...item,
          totalAssignedToDistributor: totalAssigned,
            shippedOutByDistributor: shippedOut,
          stockStatus: getStockStatus(available, totalAssigned || 1),
          expiryStatus: getExpiryStatus(item.expiryDate),
          lastUpdated: item.lastUpdated || new Date().toISOString(),
        };
      });
      
      setInventory(enrichedInventory);
    } catch (error) {
      setError('Failed to fetch inventory data. Please try again later.');
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (available, total) => {
    const ratio = total > 0 ? (available / total) : 0;
    if (ratio <= 0.2) return 'low';
    if (ratio <= 0.5) return 'medium';
    return 'good';
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return 'unknown';
    const daysToExpiry = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysToExpiry <= 0) return 'expired';
    if (daysToExpiry <= 30) return 'warning';
    return 'good';
  };

  const getStatusColor = (status) => {
    const colors = {
      low: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      good: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filtered = inventory.filter((item) => {
    const searchMatch = 
      item.product.toLowerCase().includes(search.toLowerCase()) ||
      item.batchId.toLowerCase().includes(search.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'all') return searchMatch;
    return searchMatch && (
      (filter === 'low_stock' && item.stockStatus === 'low') ||
      (filter === 'expiring_soon' && item.expiryStatus === 'warning') ||
      (filter === 'expired' && item.expiryStatus === 'expired')
    );
  });

  const renderDetailModal = (item) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={() => setSelectedItem(null)}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-lg shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Product Details</h3>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900">{item.product}</h4>
              <p className="text-sm text-gray-500">Batch: {item.batchId}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 py-3 border-t border-b">
              <div className="text-center">
                <div className="font-semibold">{item.quantity}</div>
                <div className="text-xs text-gray-500">Available</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{item.totalAssignedToDistributor}</div>
                <div className="text-xs text-gray-500">Assigned</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{item.shippedOutByDistributor || 0}</div>
                <div className="text-xs text-gray-500">Shipped</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Manufacturer</span>
                <span className="text-sm">{item.manufacturer || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Manufacturing Date</span>
                <span className="text-sm">{formatDate(item.manufacturingDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expiry Date</span>
                <span className="text-sm">{formatDate(item.expiryDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`px-2 py-1 text-xs rounded ${getStatusColor(item.stockStatus)}`}>
                  {item.stockStatus.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="space-y-0">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold whitespace-nowrap">Inventory Management</h2>
        <div className="relative flex-1">
          <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <Input
            type="text"
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg whitespace-nowrap"
        >
          <option value="all">All Items</option>
          <option value="low_stock">Low Stock</option>
          <option value="expiring_soon">Expiring Soon</option>
          <option value="expired">Expired</option>
        </select>
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded ${viewMode === 'table' ? 'bg-white shadow' : ''}`}
            title="Table View"
          >
            <Table2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Batch ID</th>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Manufacturer</th>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Remaining (You Hold)</th>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Assigned To You</th>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Shipped Out</th>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Manufacturing Date</th>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Expiry Date</th>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="p-4">
                {/* Header with Batch ID and Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                
                {/* Product Name */}
                <div className="w-40 h-6 mb-2 bg-gray-200 rounded animate-pulse"></div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <div className="w-16 h-4 mb-1 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="w-16 h-4 mb-1 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="w-20 h-4 mb-1 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-8 h-6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* Footer with Expiry */}
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : error ? (
        <div className="flex items-center justify-center h-64 text-red-500">
          <AlertCircle className="w-6 h-6 mr-2" />
          {error}
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Batch ID</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Manufacturer</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Remaining (You Hold)</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Assigned To You</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Shipped Out</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Manufacturing Date</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Expiry Date</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((item) => (
                <tr 
                  key={item.batchId}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedItem(item)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">{item.product}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.batchId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.manufacturer || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.totalAssignedToDistributor}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.shippedOutByDistributor || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.manufacturingDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.expiryDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.stockStatus)}`}>
                      {item.stockStatus.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <motion.div
              key={item.batchId}
              layoutId={item.batchId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                className="transition-shadow cursor-pointer hover:shadow-lg"
                onClick={() => setSelectedItem(item)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500">Batch ID: {item.batchId}</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.stockStatus)}`}>
                      {item.stockStatus.toUpperCase()}
                    </span>
                  </div>
                  
                  <h3 className="mb-2 text-lg font-semibold">{item.product}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-500">Remaining</p>
                      <p className="text-lg font-semibold">{item.quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Assigned</p>
                      <p className="text-lg font-semibold">{item.totalAssignedToDistributor}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Shipped Out</p>
                      <p className="text-lg font-semibold">{item.shippedOutByDistributor || 0}</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Expires: {new Date(item.expiryDate).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-1 rounded ${getStatusColor(item.expiryStatus)}`}>
                        {item.expiryStatus === 'warning' ? 'Expiring Soon' : 
                         item.expiryStatus === 'expired' ? 'Expired' : 'Valid'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedItem && renderDetailModal(selectedItem)}
      </AnimatePresence>
    </div>
  );
};

export default InventoryManagement;
