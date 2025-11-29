import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/UI/Card';
import { Input } from '../../components/UI/Input';
import { Loader2, Package, Search, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import apiClient from '../../services/api/api';

const TrackTransfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/distributer/transfers');
      
      // Check if there are any transfers
      if (!res.data.transfers || res.data.transfers.length === 0) {
        setTransfers([]);
        return;
      }
      
      // Group and aggregate transfers by batchId
      const grouped = {};
      (res.data.transfers || []).forEach(t => {
        if (!grouped[t.batchId]) {
          grouped[t.batchId] = {
            batchId: t.batchId,
            product: t.product,
            total: 0,
            left: 0,
            distributions: [],
            lastUpdated: t.timestamp || new Date().toISOString(),
            manufacturer: t.manufacturer || 'Unknown Manufacturer',
            manufacturerAddress: t.manufacturerAddress || null,
            batchInfo: t.batchInfo || null,
            qualityChecks: [],
            stats: {
              delivered: 0,
              inTransit: 0,
              returned: 0
            }
          };
        }

        // Convert quantity to number for aggregation
        const qty = Number(t.quantity) || 0;
        grouped[t.batchId].total += qty;
        
        // Add distribution with more details
        grouped[t.batchId].distributions.push({
          pharmacy: t.to,
          pharmacyDetails: t.pharmacyDetails || {},
          quantity: qty,
          status: t.status,
          timestamp: t.timestamp,
          transactionHash: t.transactionHash,
          remarks: t.remarks,
          location: t.location,
          trackingInfo: t.trackingInfo,
          qualityCheck: t.qualityCheck
        });

        // Track quality checks
        if (t.qualityCheck) {
          grouped[t.batchId].qualityChecks.push(t.qualityCheck);
        }

        // Update last updated timestamp
        if (new Date(t.timestamp) > new Date(grouped[t.batchId].lastUpdated)) {
          grouped[t.batchId].lastUpdated = t.timestamp;
        }
      });

      // Calculate statistics and sort distributions
      Object.values(grouped).forEach(batch => {
        // Calculate delivered and remaining quantities
        const delivered = batch.distributions
          .filter(d => d.status.toLowerCase() === 'delivered')
          .reduce((sum, d) => sum + d.quantity, 0);
        batch.left = batch.total - delivered;
        
        // Sort distributions by timestamp
        batch.distributions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Calculate success rate
        batch.successRate = batch.total > 0 ? (delivered / batch.total) * 100 : 0;
        
        // Add distribution statistics
        batch.stats = {
          delivered,
          inTransit: batch.distributions
            .filter(d => d.status.toLowerCase() === 'in transit')
            .reduce((sum, d) => sum + d.quantity, 0),
          returned: batch.distributions
            .filter(d => d.status.toLowerCase() === 'returned')
            .reduce((sum, d) => sum + d.quantity, 0)
        };
      });

      setTransfers(Object.values(grouped));
    } catch (error) {
      setError('Failed to fetch transfer data. Please try again later.');
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransfers = transfers.filter(batch => {
    const searchLower = search.toLowerCase();
    return (
      batch.batchId.toLowerCase().includes(searchLower) ||
      batch.product.toLowerCase().includes(searchLower) ||
      batch.manufacturer.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in transit':
        return 'bg-yellow-100 text-yellow-800';
      case 'returned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const renderDetailedView = (batch) => {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center  bg-black bg-opacity-50"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-xl h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between mb-4">
            <h3 className="text-xl font-bold">Batch Details: {batch.batchId}</h3>
            <button
              onClick={() => setSelectedBatch(null)}
              className="p-1 rounded hover:bg-gray-100"
            >
              ✕
            </button>
          </div>

          <div className="grid gap-4 mb-6 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-blue-50">
              <h4 className="font-semibold text-blue-800">Distribution Stats</h4>
              <div className="mt-2 space-y-1">
                <p><span className="font-medium">Total Quantity:</span> {batch.total}</p>
                <p><span className="font-medium">Delivered:</span> {batch.stats.delivered}</p>
                <p><span className="font-medium">In Transit:</span> {batch.stats.inTransit}</p>
                <p><span className="font-medium">Remaining:</span> {batch.left}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-purple-50">
              <h4 className="font-semibold text-purple-800">Batch Information</h4>
              <div className="mt-2 space-y-1">
                <p><span className="font-medium">Product:</span> {batch.product}</p>
                <p><span className="font-medium">Manufacturer:</span> {batch.manufacturer}</p>
                {batch.batchInfo && (
                  <>
                    <p><span className="font-medium">Dosage:</span> {batch.batchInfo.dosageForm} - {batch.batchInfo.strength}</p>
                    <p><span className="font-medium">Expiry Date:</span> {batch.batchInfo.expiryDate ? new Date(batch.batchInfo.expiryDate).toLocaleDateString() : 'N/A'}</p>
                  </>
                )}
                <p><span className="font-medium">Last Updated:</span> {formatDistanceToNow(new Date(batch.lastUpdated))} ago</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="mb-4 text-lg font-semibold">Distribution Timeline</h4>
            <div className="relative">
              {batch.distributions.map((dist, idx) => (
                <div key={idx} className="relative pb-8">
                  {idx !== batch.distributions.length - 1 && (
                    <div
                      className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex items-start space-x-3">
                    <div className={`relative px-1 ${getStatusColor(dist.status)} rounded-full`}>
                      <div className="flex items-center justify-center w-8 h-8">
                        <Package className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        Transferred to {dist.pharmacy}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        <p>Quantity: {dist.quantity} units</p>
                        <p>Status: <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dist.status)}`}>
                          {dist.status}
                        </span></p>
                        {dist.timestamp && (
                          <p className="mt-1">
                            {formatDistanceToNow(new Date(dist.timestamp))} ago
                          </p>
                        )}
                        {dist.remarks && (
                          <p className="mt-1 text-gray-600">{dist.remarks}</p>
                        )}
                        {dist.transactionHash && (
                          <p className="mt-1 font-mono text-xs text-blue-600">
                            TX: {dist.transactionHash.substring(0, 10)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-0">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold whitespace-nowrap">Track Transfers</h2>
        <div className="relative flex-1">
          <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <Input
            type="text"
            placeholder="Search batches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-24 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
              <div className="w-32 h-4 mb-3 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-40 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="pt-2 mt-2 border-t">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <div className="w-10 h-3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-14 animate-pulse"></div>
                    <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
              <div className="w-full h-2 mt-2 bg-gray-200 rounded-full animate-pulse"></div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64 text-red-500">
          <AlertCircle className="w-6 h-6 mr-2" />
          {error}
        </div>
      ) : filteredTransfers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Package className="w-12 h-12 mb-4 text-gray-300" />
          <h3 className="mb-2 text-lg font-medium">No Outgoing Transfers</h3>
          <p className="text-center text-gray-400">
            You haven't distributed any batches to pharmacies yet.<br />
            Once you start distributing, your transfer history will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTransfers.map((batch) => (
            <motion.div
              key={batch.batchId}
              layoutId={batch.batchId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                className="flex flex-col gap-2 transition-shadow cursor-pointer hover:shadow-md"
                onClick={() => setSelectedBatch(batch)}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{batch.batchId}</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${batch.left === 0 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {batch.left === 0 ? 'Completed' : 'Active'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">{batch.product}</div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  Last updated: {formatDistanceToNow(new Date(batch.lastUpdated))} ago
                </div>
                <div className="pt-2 mt-2 border-t">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-gray-500">Total</div>
                      <div className="font-semibold">{batch.total}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Delivered</div>
                      <div className="font-semibold text-green-600">{batch.stats.delivered}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">In Transit</div>
                      <div className="font-semibold text-yellow-600">{batch.stats.inTransit}</div>
                    </div>
                  </div>
                </div>
                <div className="w-full h-2 mt-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-blue-600 rounded-full"
                    style={{ width: `${batch.successRate}%` }}
                  />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedBatch && renderDetailedView(selectedBatch)}
      </AnimatePresence>
    </div>
  );
};

export default TrackTransfers;
