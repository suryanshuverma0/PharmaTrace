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
      const response = await apiClient.get('/batches/assignments');
      setAssignments(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch assignments');
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-32 h-32 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
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
            className="overflow-hidden bg-white border rounded-xl shadow-sm"
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
                <div className="grid gap-6 pt-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Assignment Details</h4>
                    <div className="grid gap-4">
                      <div className="p-4 rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-600">Distributor Details</p>
                        <div className="mt-1 space-y-1">
                          <p className="font-medium text-gray-900">{assignment.distributor.name}</p>
                          <p className="text-sm text-gray-500">{assignment.distributor.address}</p>
                          <p className="text-sm text-gray-500">{assignment.distributor.license}</p>
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-600">Products</p>
                        <div className="mt-1 space-y-1">
                          <p className="text-sm text-gray-900">
                            Serial Numbers: {assignment.serialNumbers?.join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Shipping Information</h4>
                    <div className="grid gap-4">
                      <div className="p-4 rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-600">Tracking Details</p>
                        <div className="mt-1 space-y-1">
                          <p className="font-medium text-gray-900">
                            Status: {assignment.shipmentStatus || assignment.status}
                          </p>
                          <p className="text-sm text-gray-500">
                            Updated: {new Date(assignment.lastUpdated || assignment.assignedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {assignment.remarks && (
                        <div className="p-4 rounded-lg bg-gray-50">
                          <p className="text-sm text-gray-600">Remarks</p>
                          <p className="mt-1 text-gray-900">{assignment.remarks}</p>
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
          <div className="p-6 text-center bg-white rounded-xl">
            <p className="text-gray-500">No assignments found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignedBatches;
