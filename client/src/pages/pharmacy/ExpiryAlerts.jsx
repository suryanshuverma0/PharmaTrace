import React, { useState, useEffect } from 'react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { FaExclamationTriangle, FaCalendarAlt, FaSearch, FaArrowLeft, FaBox } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { pharmacyAPI } from '../../services/api/pharmacyAPI';

const ExpiryAlerts = () => {
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDays, setFilterDays] = useState('all');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchExpiryAlerts();
  }, []);

  const fetchExpiryAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await pharmacyAPI.getExpiryAlerts();
      
      if (response.success) {
        setExpiryAlerts(response.data.alerts || []);
      } else {
        throw new Error(response.message || 'Failed to fetch expiry alerts');
      }
    } catch (error) {
      console.error('Error fetching expiry alerts:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getExpiryColor = (daysUntilExpiry) => {
    if (daysUntilExpiry <= 7) return 'text-red-600 font-bold';
    if (daysUntilExpiry <= 30) return 'text-yellow-600 font-semibold';
    return 'text-green-600';
  };

  const getExpiryBgColor = (daysUntilExpiry) => {
    if (daysUntilExpiry <= 7) return 'bg-red-50 border-red-200';
    if (daysUntilExpiry <= 30) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  const getUrgencyLevel = (daysUntilExpiry) => {
    if (daysUntilExpiry <= 7) return 'Critical';
    if (daysUntilExpiry <= 30) return 'Warning';
    return 'Normal';
  };

  const filteredAlerts = expiryAlerts.filter(alert => {
    const matchesSearch = alert.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.batchId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterDays === 'all' ||
                         (filterDays === '7' && alert.daysUntilExpiry <= 7) ||
                         (filterDays === '30' && alert.daysUntilExpiry <= 30) ||
                         (filterDays === '90' && alert.daysUntilExpiry <= 90);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-yellow-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-gray-600">Loading expiry alerts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <FaExclamationTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Error Loading Expiry Alerts</h2>
        <p className="mb-4 text-gray-600">{error}</p>
        <Button onClick={fetchExpiryAlerts}>Try Again</Button>
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
              <FaExclamationTriangle className="w-6 h-6 mr-2 text-yellow-600" />
              Expiry Alerts
            </h1>
            <p className="text-gray-600">Manage medicines approaching expiration</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Alerts</p>
          <p className="text-2xl font-bold text-gray-900">{filteredAlerts.length}</p>
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              value={filterDays}
              onChange={(e) => setFilterDays(e.target.value)}
            >
              <option value="all">All Alerts</option>
              <option value="7">Critical (≤7 days)</option>
              <option value="30">Warning (≤30 days)</option>
              <option value="90">Normal (≤90 days)</option>
            </select>
            <Button onClick={fetchExpiryAlerts}>
              <FaCalendarAlt className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <FaExclamationTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Critical</p>
              <p className="text-2xl font-bold text-red-900">
                {expiryAlerts.filter(alert => alert.daysUntilExpiry <= 7).length}
              </p>
              <p className="text-xs text-red-600">≤7 days</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FaExclamationTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Warning</p>
              <p className="text-2xl font-bold text-yellow-900">
                {expiryAlerts.filter(alert => alert.daysUntilExpiry > 7 && alert.daysUntilExpiry <= 30).length}
              </p>
              <p className="text-xs text-yellow-600">8-30 days</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FaCalendarAlt className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Normal</p>
              <p className="text-2xl font-bold text-green-900">
                {expiryAlerts.filter(alert => alert.daysUntilExpiry > 30).length}
              </p>
              <p className="text-xs text-green-600">&gt;30 days</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts List */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Expiry Alerts</h2>
        
        {filteredAlerts.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <FaBox className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Expiry Alerts</h3>
            <p className="text-gray-600">
              {searchTerm || filterDays !== 'all' 
                ? 'No alerts match your current filters.' 
                : 'All medicines are within safe expiry ranges.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div 
                key={alert.distributionId} 
                className={`p-4 border rounded-lg ${getExpiryBgColor(alert.daysUntilExpiry)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <FaBox className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{alert.product}</h3>
                      <p className="text-sm text-gray-600">Batch: {alert.batchId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                      alert.daysUntilExpiry <= 7 
                        ? 'bg-red-100 text-red-800' 
                        : alert.daysUntilExpiry <= 30 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {getUrgencyLevel(alert.daysUntilExpiry)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Quantity:</span>
                    <p className="text-gray-900">{alert.quantity} units</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Days Left:</span>
                    <p className={getExpiryColor(alert.daysUntilExpiry)}>
                      {alert.daysUntilExpiry} days
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Expiry Date:</span>
                    <p className="text-gray-900">
                      {new Date(alert.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Received:</span>
                    <p className="text-gray-900">
                      {new Date(alert.receivedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {alert.distributor && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Distributor:</span> {alert.distributor}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Actions */}
      <Card className="p-6 bg-gray-50">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Button 
            variant="outline"
            onClick={() => navigate('/pharmacy/inventory')}
            className="flex items-center justify-center p-4"
          >
            <FaBox className="w-5 h-5 mr-2" />
            View Full Inventory
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
            onClick={fetchExpiryAlerts}
            className="flex items-center justify-center p-4"
          >
            <FaCalendarAlt className="w-5 h-5 mr-2" />
            Refresh Alerts
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ExpiryAlerts;
