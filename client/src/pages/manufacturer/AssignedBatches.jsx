import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Box,
  Truck,
  Building2,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Package
} from 'lucide-react';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { Select } from '../../components/UI/Select';
import apiClient from '../../services/api/api';

const AssignedBatches = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedAssignments, setExpandedAssignments] = useState(new Set());

  useEffect(() => {
    fetchAssignedBatches();
  }, []);

  const fetchAssignedBatches = async () => {
    try {
      setLoading(true);
      // Use manufacturer-specific endpoint to get batches assigned by this manufacturer
      const response = await apiClient.get('/manufacturer/assigned-batches');
      
      // Use the API response structure
      if (response.data.success) {
        setAssignments(response.data.assignments || []);
      } else {
        setAssignments(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching assigned batches:', err);
      setError(err.response?.data?.message || 'Failed to fetch assigned batches');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleAssignment = (assignmentId) => {
    setExpandedAssignments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assignmentId)) {
        newSet.delete(assignmentId);
      } else {
        newSet.add(assignmentId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in-transit':
        return 'bg-amber-100 text-amber-800';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const searchMatch = 
      assignment.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.distributor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = filterStatus === 'all' || assignment.status.toLowerCase() === filterStatus.toLowerCase();
    return searchMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen p-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="w-64 h-8 mb-2 bg-gray-200 rounded"></div>
          <div className="h-6 bg-gray-200 rounded w-96"></div>
        </div>

        {/* Filters Skeleton */}
        <div className="grid gap-4 mb-6 md:flex md:items-center md:justify-between">
          <div className="flex flex-1 gap-4">
            <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
            <div className="w-48 h-10 bg-gray-200 rounded-lg"></div>
          </div>
        </div>

        {/* Assignments List Skeleton */}
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="overflow-hidden bg-white border shadow-sm rounded-xl">
              <div className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-6 bg-gray-200 rounded"></div>
                        <div className="w-5 h-5 bg-gray-200 rounded"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <div className="w-24 h-4 bg-gray-200 rounded"></div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <div className="w-20 h-4 bg-gray-200 rounded"></div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <div className="w-16 h-4 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Assigned Batches</h1>
        <p className="mt-2 text-lg text-gray-600">
          Track and manage your batch assignments to distributors
        </p>
      </div>

      {/* Filters */}
      <div className="grid gap-4 mb-6 md:flex md:items-center md:justify-between">
        <div className="flex flex-1 gap-4">
          <Input
            placeholder="Search by batch number or distributor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-5 h-5" />}
            className="flex-1"
          />
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            icon={<Filter className="w-5 h-5" />}
            className="w-48"
          >
            <option value="all">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="in-transit">In Transit</option>
            <option value="delivered">Delivered</option>
          </Select>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-6">
        {filteredAssignments.map((assignment) => (
          <motion.div
            key={assignment._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden bg-white border shadow-sm rounded-xl"
          >
            <div
              className="p-6 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleAssignment(assignment._id)}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Batch: {assignment.batchNumber}
                      </h3>
                      {expandedAssignments.has(assignment._id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="mt-1 space-y-1">
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {assignment.distributor.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Box className="w-4 h-4" />
                          Quantity: {assignment.quantity}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(assignment.assignedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                    {assignment.status}
                  </span>
                </div>
              </div>
            </div>

            {expandedAssignments.has(assignment._id) && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="px-6 pb-6 border-t"
              >
                {/* Manufacturer-specific metrics */}
                <div className="grid gap-4 pt-6 mb-6 md:grid-cols-3">
                  <div className="p-4 rounded-lg bg-blue-50">
                    <div className="flex items-center gap-2 mb-2 text-blue-600">
                      <Package className="w-5 h-5" />
                      <span className="font-medium">Assigned Quantity</span>
                    </div>
                    <p className="text-2xl font-semibold text-blue-900">
                      {assignment.quantity}
                    </p>
                    <p className="text-sm text-blue-600">Units to distributor</p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-green-50">
                    <div className="flex items-center gap-2 mb-2 text-green-600">
                      <Truck className="w-5 h-5" />
                      <span className="font-medium">Current Status</span>
                    </div>
                    <p className="text-lg font-semibold text-green-900">
                      {assignment.status}
                    </p>
                    <p className="text-sm text-green-600">Shipment status</p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-purple-50">
                    <div className="flex items-center gap-2 mb-2 text-purple-600">
                      <Calendar className="w-5 h-5" />  
                      <span className="font-medium">Assigned Date</span>
                    </div>
                    <p className="text-sm font-semibold text-purple-900">
                      {new Date(assignment.assignedAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-purple-600">Initial assignment</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Batch Details</h4>
                    <div className="grid gap-4">
                      <div className="p-4 rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-600">Product Information</p>
                        <div className="mt-1 space-y-1">
                          <p className="font-medium text-gray-900">{assignment.product}</p>
                          <p className="text-sm text-gray-500">Batch: {assignment.batchNumber}</p>
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-600">Distributor Details</p>
                        <div className="mt-1 space-y-1">
                          <p className="font-medium text-gray-900">{assignment.distributor.name}</p>
                          <p className="text-sm text-gray-500">Address: {assignment.distributor.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Shipment Timeline</h4>
                    <div className="space-y-3">
                      {assignment.shipmentHistory?.length > 0 ? assignment.shipmentHistory.map((shipment, index) => (
                        <div key={index} className="p-4 rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-gray-900">{shipment.status}</p>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(shipment.status)}`}>
                              {shipment.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(shipment.timestamp).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            From: {shipment.from} → To: {shipment.to}
                          </p>
                          <p className="text-sm text-gray-500">
                            Quantity: {shipment.quantity}
                          </p>
                          {shipment.remarks && (
                            <p className="mt-1 text-sm text-gray-500">{shipment.remarks}</p>
                          )}
                          {shipment.txHash && (
                            <p className="mt-1 font-mono text-xs text-gray-400">
                              Tx: {shipment.txHash.substring(0, 20)}...
                            </p>
                          )}
                        </div>
                      )) : (
                        <div className="p-4 rounded-lg bg-gray-50">
                          <p className="text-sm text-gray-500">No shipment history available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}

        {filteredAssignments.length === 0 && (
          <div className="p-8 text-center bg-white rounded-xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">No Assigned Batches Found</h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'No batches match your current filters. Try adjusting your search or filter criteria.'
                : 'You haven\'t assigned any batches to distributors yet. Batches will appear here once they are assigned to distributors.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignedBatches;
