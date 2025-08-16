import React, { useState, useEffect } from "react";
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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
      {/* Pharmacy Info Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {pharmacy?.name || "Pharmacy Dashboard"}
        </h1>
        <p className="text-gray-600">
          License: {pharmacy?.license} | Location: {pharmacy?.location}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaClock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Incoming Batches
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalIncoming || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FaWarehouse className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Inventory Items
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalInventory || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FaExclamationTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expiry Alerts</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalExpiryAlerts || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FaBox className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Units</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalValue || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Incoming Batches */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center text-lg font-semibold text-gray-900">
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
      </Card>

      {/* Expiry Alerts */}
      {expiryAlerts && expiryAlerts.length > 0 && (
        <Card className="p-6 border-yellow-200 bg-yellow-50">
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
        </Card>
      )}

      {/* Recent Inventory */}
      <Card className="p-6">
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
      </Card>

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
