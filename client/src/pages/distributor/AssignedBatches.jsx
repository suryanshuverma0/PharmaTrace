import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Truck,
  Calendar,
  Package,
  Building2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import apiClient from "../../services/api/api";

const AssignedBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedBatches, setExpandedBatches] = useState(new Set());

  useEffect(() => {
    fetchAssignedBatches();
  }, []);

  const fetchAssignedBatches = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/distributer/batches");
      const formattedBatches = (res.data.batches || []).map((batch) => {
        // Get the latest shipment history entry
        const latestHistory =
          batch.shipmentHistory.length > 0
            ? batch.shipmentHistory[batch.shipmentHistory.length - 1]
            : null;

        // Get the latest environmental conditions and quality check from history
        const latestEnvConditions = batch.shipmentHistory.find(
          (h) => h.environmentalConditions
        )?.environmentalConditions;
        const latestQualityCheck = batch.shipmentHistory.find(
          (h) => h.qualityCheck
        )?.qualityCheck;

        return {
          _id: batch.batchId,
          batchNumber: batch.batchId,
          productDetails: batch.product,
          status: batch.status,
          manufacturer: batch.manufacturer,
          // New fields from updated API
          remainingQuantity: batch.quantity,
          totalAssignedToDistributor: batch.totalAssignedToDistributor,
          shippedOutByDistributor: batch.shippedOutByDistributor,
          serialNumber: batch.serialNumber,
          storageConditions: batch.storageConditions,
          manufactureDate: batch.manufactureDate,
          expiryDate: batch.expiryDate,
          dosageForm: batch.dosageForm,
          strength: batch.strength,
          productionLocation: batch.productionLocation,
          approvalCertId: batch.approvalCertId,
          assignedAt: latestHistory?.timestamp || new Date().toISOString(),
          environmentalConditions: latestEnvConditions || null,
          qualityCheck: latestQualityCheck
            ? {
                result: latestQualityCheck.result,
                performedBy: latestQualityCheck.performedBy || "QA Team",
                date: latestQualityCheck.date,
              }
            : null,
          remarks: latestHistory?.remarks || "",
          shipmentHistory: batch.shipmentHistory,
        };
      });

      setBatches(formattedBatches);

      // Expand the first batch by default
      if (formattedBatches.length > 0) {
        setExpandedBatches(new Set([formattedBatches[0]._id]));
      }

      setError(null);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to fetch assigned batches"
      );
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleBatchExpansion = (batchId) => {
    setExpandedBatches((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(batchId)) {
        newSet.delete(batchId);
      } else {
        newSet.add(batchId);
      }
      return newSet;
    });
  };

  const isBatchExpanded = (batchId) => {
    return expandedBatches.has(batchId);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "produced":
      case "manufactuerd": // Handle both spellings
        return "bg-blue-100 text-blue-800";
      case "in transit":
        return "bg-amber-100 text-amber-800";
      case "delivered":
        return "bg-emerald-100 text-emerald-800";
      case "returned":
        return "bg-red-100 text-red-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "recalled":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
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
            <p className="text-gray-500">
              No batches have been assigned to you yet.
            </p>
          </div>
        ) : (
          batches.map((batch) => {
            const isExpanded = isBatchExpanded(batch._id);
            return (
              <motion.div
                key={batch._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`overflow-hidden bg-white border shadow-lg rounded-2xl border-gray-200/50 transition-all duration-300 ${
                  isExpanded ? "shadow-lg" : "shadow-md hover:shadow-lg"
                }`}
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
                          <p className="text-base text-gray-900">
                            {batch.productDetails}
                          </p>
                          {!isExpanded && (
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                Qty: {batch.remainingQuantity}
                              </span>
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {batch.manufacturer}
                              </span>
                              {batch.expiryDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Exp:{" "}
                                  {new Date(
                                    batch.expiryDate
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                          {isExpanded && (
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Mfg:{" "}
                                  {new Date(
                                    batch.manufactureDate
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              {batch.expiryDate && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    Exp:{" "}
                                    {new Date(
                                      batch.expiryDate
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                <span>From: {batch.manufacturer}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row items-start gap-2">
                      <div className="space-y-1.5">
                        <span
                          className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                            batch.status
                          )}`}
                        >
                          {batch.status}
                        </span>
                        <p className="text-sm text-gray-500">
                          Assigned:{" "}
                          {new Date(batch.assignedAt).toLocaleString()}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleBatchExpansion(batch._id)}
                        className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors duration-200 rounded-lg hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        aria-label={
                          isBatchExpanded(batch._id)
                            ? "Minimize batch details"
                            : "Expand batch details"
                        }
                      >
                        {isBatchExpanded(batch._id) ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Batch Details */}
                {isBatchExpanded(batch._id) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    {/* Batch Details */}
                    <div className="p-6 bg-gray-50">
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="p-4 bg-white rounded-xl">
                          <div className="flex items-center gap-2 mb-2 text-gray-600">
                            <Package className="w-5 h-5" />
                            <span className="font-medium">
                              Remaining (You Hold)
                            </span>
                          </div>
                          <p className="text-2xl font-semibold">
                            {batch.remainingQuantity}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            of {batch.totalAssignedToDistributor} assigned
                          </p>
                        </div>
                        <div className="p-4 bg-white rounded-xl">
                          <div className="flex items-center gap-2 mb-2 text-gray-600">
                            <Package className="w-5 h-5" />
                            <span className="font-medium">Shipped Out</span>
                          </div>
                          <p className="text-2xl font-semibold">
                            {batch.shippedOutByDistributor || 0}
                          </p>
                        </div>

                        {batch.productionLocation && (
                          <div className="p-4 bg-white rounded-xl">
                            <div className="flex items-center gap-2 mb-2 text-gray-600">
                              <Building2 className="w-5 h-5" />
                              <span className="font-medium">
                                Production Location
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p>{batch.productionLocation}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Shipment History Timeline */}
                      <div className="mt-6">
                        <h4 className="mb-4 text-lg font-medium text-gray-900">
                          Shipment History
                        </h4>
                        <div className="relative">
                          {batch.shipmentHistory.map((event, index) => (
                            <div key={event._id} className="relative pb-8">
                              {index !== batch.shipmentHistory.length - 1 && (
                                <div
                                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                                  aria-hidden="true"
                                />
                              )}
                              <div className="relative flex items-start space-x-3">
                                <div
                                  className={`relative px-1 ${getStatusColor(
                                    event.status
                                  )} rounded-full`}
                                >
                                  <div className="flex items-center justify-center w-8 h-8">
                                    {event.status.toLowerCase() ===
                                    "delivered" ? (
                                      <Package className="w-5 h-5" />
                                    ) : event.status.toLowerCase() ===
                                      "in transit" ? (
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
                                      <span className="ml-2 text-gray-500">
                                        ({event.quantity} units)
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1 text-sm text-gray-500">
                                    <p>
                                      {new Date(
                                        event.timestamp
                                      ).toLocaleString()}
                                    </p>
                                    {event.remarks && (
                                      <p className="mt-1">{event.remarks}</p>
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
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AssignedBatches;
