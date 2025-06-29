import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Truck, Send, Package, Loader2 } from "lucide-react";
import { Link } from "react-router-dom"; // Make sure you import Link if you use it in alert message
import apiClient from "../../services/api/api";
import Button from "../../components/UI/Button";
import Select from "../../components/UI/Select";
import Alert from "../../components/UI/Alert";

const DUMMY_ASSIGNED_BATCHES = [
  {
    batchNumber: "BN2025",
    productName: "Paracetamol",
    distributor: "Health Distributors",
    distributorWallet: "0x123...abcd",
    quantity: 1000,
    remarks: "Urgent shipment",
    assignedAt: "2025-06-28 10:30",
    shipmentStatus: "Produced",
  },
  {
    batchNumber: "BN2024",
    productName: "Ibuprofen",
    distributor: "MediLogix",
    distributorWallet: "0x456...efgh",
    quantity: 500,
    remarks: "",
    assignedAt: "2025-06-27 15:20",
    shipmentStatus: "In Transit",
  },
];

const AssignBatch = () => {
  const [batches, setBatches] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedDistributor, setSelectedDistributor] = useState("");
  const [quantity, setQuantity] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [alert, setAlert] = useState(null);

  const [recentAssignments, setRecentAssignments] = useState(
    DUMMY_ASSIGNED_BATCHES
  );

  useEffect(() => {
    const fetchDistributerData = async () => {
      setLoading(true);
      try {
        // Fetch distributors
        const distRes = await apiClient.get("/distributer/list");
        setDistributors(distRes?.data || []);
      } catch (err) {
        setError("Failed to load distributors.");
      } finally {
        setLoading(false);
      }
    };
    fetchDistributerData();
  }, []);

  useEffect(() => {
  const fetchRecentAssignments = async () => {
    try {
      const res = await apiClient.get("/batches/assigned-batches");
      setRecentAssignments(res.data.assignments || []);
    } catch (err) {
      console.error("Failed to load assigned batches:", err);
    }
  };
  fetchRecentAssignments();
}, []);


  useEffect(() => {
    const fetchBatchData = async () => {
      try {
        // Fetch batches
        const batchesResponse = await apiClient.get("/batches/available");
        setBatches(batchesResponse.data.batches || []);
        if (batchesResponse.data.batches.length === 0) {
          setAlert({
            type: "warning",
            title: "No Batches Available",
            message: (
              <>
                You need to register a batch before assigning distributor.{" "}
                <Link to="/register-batch" className="text-blue-600 underline">
                  Register a batch now
                </Link>
                .
              </>
            ),
          });
        }
      } catch (err) {
        setAlert({
          type: "error",
          title: "Failed to Load Data",
          message:
            err.response?.data?.message ||
            "An error occurred while fetching batches.",
        });
      }
    };
    fetchBatchData();
  }, []);

 const handleAssign = async (e) => {
    e.preventDefault();
    setAssigning(true);
    setError("");
    setSuccess("");

    try {
      const batch = batches.find(b => b._id === selectedBatch);
      const distributor = distributors.find(d => d._id === selectedDistributor);

      if (!batch || !distributor || !distributor.user?.address) {
        setError("Invalid batch or distributor selected.");
        setAssigning(false);
        return;
      }

      if (parseInt(quantity) > batch.quantityAvailable) {
        setError("Assigned quantity exceeds available quantity.");
        setAssigning(false);
        return;
      }

      await apiClient.post(`batches/${selectedBatch}/assign/`, {
        to: distributor.user.address,
        remarks,
        status: "In Transit",
        quantity: parseInt(quantity)
      });

      setSuccess("Batch assigned to distributor successfully!");
      setSelectedBatch("");
      setSelectedDistributor("");
      setQuantity("");
      setRemarks("");

      setRecentAssignments(prev => [
        {
          batchNumber: batch.batchNumber,
          productName: `${batch.dosageForm} ${batch.strength}`,
          distributor: distributor.companyName,
          distributorWallet: distributor.user.address,
          quantity: parseInt(quantity),
          remarks,
          assignedAt: new Date().toLocaleString(),
          shipmentStatus: "In Transit"
        },
        ...prev
      ]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign batch.");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen space-y-8">
      <div className="w-full max-w-3xl p-6 bg-white border border-gray-200 shadow rounded-2xl">
        <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
          <Package className="w-5 h-5 text-blue-600" /> Recently Assigned
          Batches
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 font-semibold">Batch Number</th>
                <th className="px-4 py-2 font-semibold">Product</th>
                <th className="px-4 py-2 font-semibold">Distributor</th>
                <th className="px-4 py-2 font-semibold">Wallet</th>
                <th className="px-4 py-2 font-semibold">Quantity</th>
                <th className="px-4 py-2 font-semibold">Assigned At</th>
                <th className="px-4 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAssignments.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No assignments found.
                  </td>
                </tr>
              ) : (
                recentAssignments.map((a, idx) => (
                  <tr
                    key={a.batchNumber + a.distributor + idx}
                    className="border-b last:border-0"
                  >
                    <td className="px-4 py-2">{a.batchNumber}</td>
                    <td className="px-4 py-2">{a.productName}</td>
                    <td className="px-4 py-2">{a.distributor}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {a.distributorWallet}
                    </td>
                    <td className="px-4 py-2">{a.quantity}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {a.assignedAt}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap
                        ${
                          a.shipmentStatus === "Produced"
                            ? "bg-blue-100 text-blue-800"
                            : a.shipmentStatus === "In Transit"
                            ? "bg-amber-100 text-amber-800"
                            : a.shipmentStatus === "Delivered"
                            ? "bg-emerald-100 text-emerald-800"
                            : a.shipmentStatus === "Returned"
                            ? "bg-red-100 text-red-800"
                            : a.shipmentStatus === "Recalled"
                            ? "bg-gray-200 text-gray-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{
                            backgroundColor:
                              a.shipmentStatus === "Produced"
                                ? "#2563eb"
                                : a.shipmentStatus === "In Transit"
                                ? "#f59e42"
                                : a.shipmentStatus === "Delivered"
                                ? "#059669"
                                : a.shipmentStatus === "Returned"
                                ? "#dc2626"
                                : a.shipmentStatus === "Recalled"
                                ? "#6b7280"
                                : "#a3a3a3",
                          }}
                        />
                        {a.shipmentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl p-8 mb-10 bg-white border border-gray-200 shadow-lg rounded-2xl"
      >
        {alert && (
          <Alert
            type={alert.type}
            title={alert.title}
            onClose={() => setAlert(null)}
            className="max-w-4xl mx-auto mb-6"
          >
            {alert.message}
          </Alert>
        )}

        {error && (
          <Alert
            type="error"
            onClose={() => setError("")}
            className="mb-4"
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            type="success"
            onClose={() => setSuccess("")}
            className="mb-4"
          >
            {success}
          </Alert>
        )}

        <div className="flex items-center gap-3 mb-6">
          <Truck className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Assign Batch to Distributor
          </h2>
        </div>
        <p className="mb-6 text-gray-600">
          Select a batch and assign it to a distributor for shipment.
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="ml-3 text-blue-600">Loading...</span>
          </div>
        ) : (
          <form onSubmit={handleAssign} className="space-y-6">
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Select Batch
              </label>
              <Select
                value={selectedBatch}
                onChange={setSelectedBatch}
                required
                className="w-full"
                options={[
                  { value: "", label: "-- Select Batch --" },
                  ...(batches || []).map((batch) => ({
                    value: batch._id,
                    label: `${batch.batchNumber} (${batch.quantityAvailable} available)`,
                  })),
                ]}
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Select Distributor
              </label>
              <Select
                value={selectedDistributor}
                onChange={setSelectedDistributor}
                options={[
                  { value: "", label: "-- Select Distributor --" },
                  ...(distributors || []).map((dist) => ({
                    value: dist._id,
                    label: `${dist.companyName} (${dist.user?.address})`,
                  })),
                ]}
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter quantity to assign"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any remarks (optional)"
                rows={3}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              className="flex items-center justify-center w-full gap-2"
              disabled={
                assigning || !selectedBatch || !selectedDistributor || !quantity
              }
            >
              {assigning ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              Assign Batch
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default AssignBatch;
