import React, { useState, useEffect } from 'react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { FaWarehouse, FaSearch, FaArrowLeft, FaBox, FaCalendarAlt, FaFilter } from 'react-icons/fa';
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
    
    if (diffDays <= 7) return { status: 'critical', color: 'text-red-600 font-bold', bgColor: 'bg-red-50 border-red-200' };
    if (diffDays <= 30) return { status: 'warning', color: 'text-yellow-600 font-semibold', bgColor: 'bg-yellow-50 border-yellow-200' };
    return { status: 'normal', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' };
  };

  const filteredAndSortedInventory = inventory
    .filter(item => 
      item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batchId.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'receivedAt' || sortBy === 'expiryDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
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
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/pharmacy/dashboard')}
          >
            <FaArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FaWarehouse className="w-6 h-6 mr-2 text-green-600" />
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
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by product name or batch ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
            <Button onClick={fetchInventory}>
              <FaWarehouse className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaBox className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FaWarehouse className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Units</p>
              <p className="text-2xl font-bold text-gray-900">
                {inventory.reduce((sum, item) => sum + item.quantity, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FaCalendarAlt className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900">
                {inventory.filter(item => {
                  const diffDays = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                  return diffDays <= 30;
                }).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <FaFilter className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-gray-900">
                {inventory.filter(item => {
                  const diffDays = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                  return diffDays <= 7;
                }).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Inventory List */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Inventory Items</h2>
        
        {filteredAndSortedInventory.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <FaBox className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Inventory Items</h3>
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

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Quantity:</span>
                      <p className="text-gray-900 font-semibold">{item.quantity} units</p>
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
                    <div className="mt-3 pt-3 border-t border-gray-200">
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
      </Card>

      {/* Actions */}
      <Card className="p-6 bg-gray-50">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Button 
            variant="outline"
            onClick={() => navigate('/pharmacy/expiry-alerts')}
            className="flex items-center justify-center p-4"
          >
            <FaCalendarAlt className="w-5 h-5 mr-2" />
            View Expiry Alerts
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/pharmacy/dashboard')}
            className="flex items-center justify-center p-4"
          >
            <FaArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Button>
          <Button 
            onClick={fetchInventory}
            className="flex items-center justify-center p-4"
          >
            <FaWarehouse className="w-5 h-5 mr-2" />
            Refresh Inventory
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Inventory;
