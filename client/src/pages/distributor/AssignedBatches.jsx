import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Truck, 
  Calendar, 
  Package, 
  Building2,
  ThermometerIcon,
  ClipboardCheck,
  AlertCircle
} from 'lucide-react';
import apiClient from '../../services/api/api';

const AssignedBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssignedBatches();
  }, []);

  const fetchAssignedBatches = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/distributer/batches');
      const formattedBatches = (res.data.batches || []).map(batch => {
        // Get the latest shipment history entry
        const latestHistory = batch.shipmentHistory.length > 0 
          ? batch.shipmentHistory[batch.shipmentHistory.length - 1]
          : null;

        // Get the latest environmental conditions and quality check from history
        const latestEnvConditions = batch.shipmentHistory.find(h => h.environmentalConditions)?.environmentalConditions;
        const latestQualityCheck = batch.shipmentHistory.find(h => h.qualityCheck)?.qualityCheck;
        
        return {
          _id: batch.batchId, // Using batchId as _id since it appears unique
          batchNumber: batch.batchId,
          productDetails: batch.product,
          status: batch.status,
          manufacturer: batch.manufacturer,
          assignedQuantity: batch.quantity,
          serialNumber: batch.serialNumber,
          assignedAt: latestHistory?.timestamp || new Date().toISOString(),
          manufactureDate: latestHistory?.timestamp,
          expiryDate: null, // Add if available in your data
          environmentalConditions: latestEnvConditions || null,
          qualityCheck: latestQualityCheck ? {
            result: latestQualityCheck.result,
            performedBy: latestQualityCheck.performedBy || 'QA Team',
            date: latestQualityCheck.date
          } : null,
          remarks: latestHistory?.remarks || '',
          shipmentHistory: batch.shipmentHistory
        };
      });
      
      setBatches(formattedBatches);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch assigned batches');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'produced':
      case 'manufactuerd': // Handle both spellings
        return 'bg-blue-100 text-blue-800';
      case 'in transit':
        return 'bg-amber-100 text-amber-800';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      case 'returned':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'recalled':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading assigned batches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Assigned Batches</h1>
        <p className="mt-2 text-lg text-gray-600">
          View and manage batches assigned to you by manufacturers
        </p>
      </div>

      <div className="space-y-6">
        {batches.length === 0 ? (
          <div className="p-6 text-center bg-white border rounded-xl">
            <p className="text-gray-500">No batches have been assigned to you yet.</p>
          </div>
        ) : (
          batches.map((batch) => (
            <motion.div
              key={batch._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden bg-white border shadow-lg rounded-2xl border-gray-200/50"
            >
              {/* Batch Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap">
                  <div className="flex items-start flex-1 gap-4">
                    <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Batch: {batch.batchNumber}
                      </h3>
                      <div className="mt-1 space-y-1">
                        <p className="text-base text-gray-900">{batch.productDetails}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Mfg: {new Date(batch.manufactureDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Exp: {new Date(batch.expiryDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            <span>From: {batch.manufacturer}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(batch.status)}`}>
                      {batch.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      Assigned: {new Date(batch.assignedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Batch Details */}
              <div className="p-6 bg-gray-50">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="p-4 bg-white rounded-xl">
                    <div className="flex items-center gap-2 mb-2 text-gray-600">
                      <Package className="w-5 h-5" />
                      <span className="font-medium">Assigned Quantity</span>
                    </div>
                    <p className="text-2xl font-semibold">{batch.assignedQuantity}</p>
                  </div>

                  {batch.environmentalConditions && (
                    <div className="p-4 bg-white rounded-xl">
                      <div className="flex items-center gap-2 mb-2 text-gray-600">
                        <ThermometerIcon className="w-5 h-5" />
                        <span className="font-medium">Storage Conditions</span>
                      </div>
                      <div className="space-y-1">
                        <p>Temperature: {batch.environmentalConditions.temperature}</p>
                        <p>Humidity: {batch.environmentalConditions.humidity}</p>
                      </div>
                    </div>
                  )}

                  {batch.qualityCheck && (
                    <div className="p-4 bg-white rounded-xl">
                      <div className="flex items-center gap-2 mb-2 text-gray-600">
                        <ClipboardCheck className="w-5 h-5" />
                        <span className="font-medium">Quality Check</span>
                      </div>
                      <div className="space-y-1">
                        <p>Result: {batch.qualityCheck.result}</p>
                        <p className="text-sm text-gray-500">
                          By: {batch.qualityCheck.performedBy}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Shipment History Timeline */}
                <div className="mt-6">
                  <h4 className="mb-4 text-lg font-medium text-gray-900">Shipment History</h4>
                  <div className="relative">
                    {batch.shipmentHistory.map((event, index) => (
                      <div key={event._id} className="relative pb-8">
                        {index !== batch.shipmentHistory.length - 1 && (
                          <div className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                        )}
                        <div className="relative flex items-start space-x-3">
                          <div className={`relative px-1 ${getStatusColor(event.status)} rounded-full`}>
                            <div className="flex items-center justify-center w-8 h-8">
                              {event.status.toLowerCase() === 'delivered' ? (
                                <ClipboardCheck className="w-5 h-5" />
                              ) : event.status.toLowerCase() === 'in transit' ? (
                                <Truck className="w-5 h-5" />
                              ) : (
                                <Package className="w-5 h-5" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {event.status}
                              {event.quantity && (
                                <span className="ml-2 text-gray-500">({event.quantity} units)</span>
                              )}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              <p>{new Date(event.timestamp).toLocaleString()}</p>
                              {event.remarks && (
                                <p className="mt-1">{event.remarks}</p>
                              )}
                              {event.environmentalConditions && (
                                <div className="p-2 mt-2 rounded-lg bg-gray-50">
                                  <p className="font-medium">Environmental Conditions:</p>
                                  <p>Temperature: {event.environmentalConditions.temperature}</p>
                                  <p>Humidity: {event.environmentalConditions.humidity}</p>
                                  <p>Status: {event.environmentalConditions.status}</p>
                                </div>
                              )}
                              {event.qualityCheck && (
                                <div className="p-2 mt-2 rounded-lg bg-gray-50">
                                  <p className="font-medium">Quality Check:</p>
                                  <p>Result: {event.qualityCheck.result}</p>
                                  <p>Date: {new Date(event.qualityCheck.date).toLocaleString()}</p>
                                  {event.qualityCheck.notes && (
                                    <p>Notes: {event.qualityCheck.notes}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {batch.remarks && (
                  <div className="flex items-center gap-2 px-4 py-3 mt-4 text-sm text-blue-700 bg-blue-50 rounded-xl">
                    <AlertCircle className="w-5 h-5" />
                    <span>{batch.remarks}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssignedBatches;
