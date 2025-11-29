import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "../../components/UI/Card";
import { Button } from "../../components/UI/Button";
import {
  FaBox,
  FaCheckCircle,
  FaExclamationTriangle,
  FaQrcode,
  FaClock,
  FaWarehouse,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { pharmacyAPI } from "../../services/api/pharmacyAPI";
import ReceiptConfirmationModal from "../../components/modals/ReceiptConfirmationModal";
import toast from "react-hot-toast";
import { Building2, FileText } from "lucide-react";

const PharmacyDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingReceipt, setConfirmingReceipt] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await pharmacyAPI.getDashboardData();

      if (response.success) {
        setDashboardData(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async (verificationData) => {
    try {
      setConfirmingReceipt(selectedBatch.distributionId);
      const response = await pharmacyAPI.confirmReceipt(
        selectedBatch.distributionId,
        verificationData
      );

      if (response.success) {
        // Refresh dashboard data
        await fetchDashboardData();
        setShowConfirmationModal(false);
        setSelectedBatch(null);
        
        // Show success toast
        toast.success(
          `Receipt confirmed successfully! ${
            response.data.damageReported ? "Issues reported and logged." : ""
          }`,
          {
            duration: 4000,
            position: 'top-right',
          }
        );
      } else {
        throw new Error(response.message || "Failed to confirm receipt");
      }
    } catch (error) {
      console.error("Error confirming receipt:", error);
      toast.error(`Error: ${error.message}`, {
        duration: 5000,
        position: 'top-right',
      });
    } finally {
      setConfirmingReceipt(null);
    }
  };

  const openConfirmationModal = (batch) => {
    setSelectedBatch(batch);
    setShowConfirmationModal(true);
  };

  const closeConfirmationModal = () => {
    setShowConfirmationModal(false);
    setSelectedBatch(null);
    setConfirmingReceipt(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_transit":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getExpiryColor = (daysUntilExpiry) => {
    if (daysUntilExpiry <= 7) return "text-red-600 font-bold";
    if (daysUntilExpiry <= 30) return "text-yellow-600 font-semibold";
    return "text-green-600";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="w-64 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 mt-2 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="ml-4 space-y-2">
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Cards Skeleton */}
        <div className="space-y-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-40 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <FaExclamationTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Error Loading Dashboard
        </h2>
        <p className="mb-4 text-gray-600">{error}</p>
        <Button onClick={fetchDashboardData}>Try Again</Button>
      </div>
    );
  }

  const { pharmacy, stats, incomingBatches, inventory, expiryAlerts } =
    dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-gray-900">
              <span className='text-2xl font-semibold text-gray-700'>Welcome Back,</span> <br></br> {pharmacy?.name || 'Pharmacy Dashboard'}
            </h2>
            <div className="space-y-1">
              <p className="text-lg text-gray-600">
                Here's your pharmacy and inventory overview
              </p>
              {pharmacy && (
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {pharmacy.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    License: {pharmacy.license}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8">
        <div className="grid grid-cols-1 gap-6 mb-6 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-white border shadow-lg rounded-2xl border-gray-200/50"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-100 rounded-xl">
                <div className="text-blue-600"><FaClock className="w-6 h-6" /></div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900">
                {stats?.totalIncoming || 0}
              </div>
              <div className="text-sm text-gray-600">Incoming Batches</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-white border shadow-lg rounded-2xl border-gray-200/50"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-100 rounded-xl">
                <div className="text-green-600"><FaWarehouse className="w-6 h-6" /></div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900">
                {stats?.totalInventory || 0}
              </div>
              <div className="text-sm text-gray-600">Inventory Items</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 bg-white border shadow-lg rounded-2xl border-gray-200/50"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-amber-100">
                <div className="text-amber-600"><FaExclamationTriangle className="w-6 h-6" /></div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900">
                {stats?.totalExpiryAlerts || 0}
              </div>
              <div className="text-sm text-gray-600">Expiry Alerts</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 bg-white border shadow-lg rounded-2xl border-gray-200/50"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-100 rounded-xl">
                <div className="text-purple-600"><FaBox className="w-6 h-6" /></div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900">
                {stats?.totalValue || 0}
              </div>
              <div className="text-sm text-gray-600">Total Units</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-1">
        {/* Incoming Batches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 bg-white border shadow-lg rounded-2xl border-gray-200/50"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center text-lg font-semibold text-transparent bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text">
              <FaClock className="w-5 h-5 mr-2 text-blue-600" />
              Incoming Batches
            </h2>
            <span className="text-sm text-gray-500">
              {incomingBatches?.length || 0} pending deliveries
            </span>
          </div>

        {incomingBatches && incomingBatches.length > 0 ? (
          <div className="space-y-4">
            {incomingBatches.map((batch) => (
              <div
                key={batch.distributionId}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {batch.product}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Batch: {batch.batchId}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                        batch.status
                      )}`}
                    >
                      {batch.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Quantity:</span>{" "}
                    {batch.quantity} units
                  </div>
                  <div>
                    <span className="font-medium">From:</span>{" "}
                    {batch.distributor}
                  </div>
                  <div>
                    <span className="font-medium">Assigned:</span>{" "}
                    {new Date(batch.assignedAt).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Expires:</span>{" "}
                    {new Date(batch.expiryDate).toLocaleDateString()}
                  </div>
                </div>

                {batch.remarks && (
                  <p className="mb-3 text-sm text-gray-600">
                    <span className="font-medium">Notes:</span> {batch.remarks}
                  </p>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={() => openConfirmationModal(batch)}
                    disabled={confirmingReceipt === batch.distributionId}
                    className="max-w-[250px]"
                  >
                    {confirmingReceipt === batch.distributionId ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                        Confirming...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="w-4 h-4 mr-2" />
                        Verify & Confirm Receipt
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <FaBox className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No incoming batches</p>
          </div>
        )}
        </motion.div>

        {/* Expiry Alerts */}
        {expiryAlerts && expiryAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 border border-yellow-200 shadow-lg rounded-2xl bg-yellow-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center text-lg font-semibold text-yellow-800">
                <FaExclamationTriangle className="w-5 h-5 mr-2" />
                Expiry Alerts
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/pharmacy/expiry-alerts")}
              >
                View All
              </Button>
            </div>

            <div className="space-y-3">
              {expiryAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.distributionId}
                  className="p-3 bg-white border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{alert.product}</p>
                      <p className="text-sm text-gray-600">
                        Batch: {alert.batchId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${getExpiryColor(
                          alert.daysUntilExpiry
                        )}`}
                      >
                        {alert.daysUntilExpiry} days left
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(alert.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Inventory */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="p-6 bg-white border shadow-lg rounded-2xl border-gray-200/50"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center text-lg font-semibold text-gray-900">
              <FaWarehouse className="w-5 h-5 mr-2 text-green-600" />
              Recent Inventory
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/pharmacy/inventory")}
            >
              View All Inventory
            </Button>
          </div>

          {inventory && inventory.length > 0 ? (
            <div className="space-y-3">
              {inventory.slice(0, 5).map((item) => (
                <div
                  key={item.distributionId}
                  className="p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.product}</p>
                      <p className="text-sm text-gray-600">
                        Batch: {item.batchId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {item.quantity} units
                      </p>
                      <p className="text-xs text-gray-500">
                        Received: {new Date(item.receivedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <FaWarehouse className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No inventory items</p>
            </div>
          )}
        </motion.div>

      </div>

      {/* Receipt Confirmation Modal */}
      <ReceiptConfirmationModal
        batch={selectedBatch}
        isOpen={showConfirmationModal}
        onClose={closeConfirmationModal}
        onConfirm={handleConfirmReceipt}
        isLoading={confirmingReceipt === selectedBatch?.distributionId}
      />
    </div>
  );
};

export default PharmacyDashboard;
