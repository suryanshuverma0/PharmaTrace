import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Truck, Send, Package, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import apiClient from "../../services/api/api";
import Button from "../../components/UI/Button";
import Select from "../../components/UI/Select";
import MultiSelect from "../../components/UI/MultiSelect";
import Alert from "../../components/UI/Alert";
import RecentAssignments from "../../components/manufacturer/RecentAssignments";
import toast from "react-hot-toast";

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
  const [districts, setDistricts] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedDistributor, setSelectedDistributor] = useState("");
  const [quantity, setQuantity] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingDistributors, setLoadingDistributors] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [alert, setAlert] = useState(null);

  const [recentAssignments, setRecentAssignments] = useState([]);

  // Fetch districts on component mount
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await apiClient.get('/nepal/districts');
        if (response.data.success) {
          const districtOptions = response.data.data.map(district => ({
            value: district,
            label: district
          }));
          setDistricts(districtOptions);
        }
      } catch (error) {
        console.error('Failed to fetch districts:', error);
        setError('Failed to load districts');
      }
    };
    
    fetchDistricts();
  }, []);

  // Fetch distributors based on selected regions
  useEffect(() => {
    const fetchDistributerData = async () => {
      if (selectedRegions.length === 0) {
        setDistributors([]);
        return;
      }
      
      setLoadingDistributors(true);
      try {
        const params = new URLSearchParams();
        selectedRegions.forEach(region => params.append('regions', region));
        
        const distRes = await apiClient.get(`/distributer/list?${params.toString()}`);
        setDistributors(distRes?.data || []);
        
        // Reset selected distributor if not in the new list
        if (selectedDistributor && !distRes?.data?.some(d => d._id === selectedDistributor)) {
          setSelectedDistributor("");
        }
      } catch (err) {
        setError("Failed to load distributors for selected regions.");
        setDistributors([]);
      } finally {
        setLoadingDistributors(false);
      }
    };
    
    fetchDistributerData();
  }, [selectedRegions]);

  // Initial loading state
  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
  const fetchRecentAssignments = async () => {
    try {
      const res = await apiClient.get("/batches/assigned-batches");
      if (res.data && res.data.batches) {
        // Format the assignments data based on the actual API response
        const formattedAssignments = res.data.batches.map(batch => ({
          _id: batch.batchId || batch._id,
          batchNumber: batch.batchId,
          productName: batch.product,
          distributor: batch.shipmentHistory?.[0]?.actor?.name || 'N/A',
          distributorWallet: batch.shipmentHistory?.[0]?.to || 'N/A',
          quantity: batch.quantity,
          remarks: batch.shipmentHistory?.[0]?.remarks || '',
          assignedAt: new Date(batch.shipmentHistory?.[0]?.timestamp || new Date()).toLocaleString(),
          shipmentStatus: batch.status,
          environmentalConditions: batch.shipmentHistory?.[0]?.environmentalConditions,
          qualityCheck: batch.shipmentHistory?.[0]?.qualityCheck,
          shipmentHistory: batch.shipmentHistory?.map(hist => ({
            status: hist.status,
            timestamp: hist.timestamp,
            from: hist.from,
            to: hist.to,
            quantity: hist.quantity,
            remarks: hist.remarks,
            actor: hist.actor,
            environmentalConditions: hist.environmentalConditions,
            qualityCheck: hist.qualityCheck
          }))
        }));
        setRecentAssignments(formattedAssignments);
      } else {
        setRecentAssignments([]);
      }
    } catch (err) {
      console.error("Failed to load assigned batches:", err);
      setAlert({
        type: "error",
        title: "Error",
        message: "Failed to load recent assignments. Please try again later."
      });
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
                <Link to="/manufacturer/register/batch" className="text-blue-600 underline">
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

      if (!batch || !distributor) {
        setError("Invalid batch or distributor selected.");
        setAssigning(false);
        return;
      }
      if (parseInt(quantity) > batch.quantityRemainingForAssignment) {
        setError("Assigned quantity exceeds available quantity.");
        setAssigning(false);
        return;
      }

      // Create the assignment with tracking information
      const response = await apiClient.post(`/batches/${batch.batchNumber}/assign`, {
        batchId: batch.batchNumber,
        product: batch.product || batch.productName,
        quantity: parseInt(quantity),
        status: "In Transit",
        to: distributor.user?.address,
        remarks,
        actor: {
          name: distributor.companyName,
          type: "Distributor",
          license: distributor.licenseNumber,
          location: distributor.address
        },
        environmentalConditions: {
          temperature: "25°C",
          humidity: "60%",
          status: "Normal"
        },
        qualityCheck: {
          result: "Pass",
          notes: "Pre-shipment quality check passed",
          performedBy: "QA Team"
        }
      });

      // Update the batches list with new quantity
      setBatches(prevBatches => 
        prevBatches.map(b => 
          b._id === selectedBatch 
            ? { ...b, quantityAvailable: b.quantityAvailable - parseInt(quantity) }
            : b
        )
      );

      // Add new assignment to recent assignments
      if (response.data.assignment) {
        setRecentAssignments(prev => [response.data.assignment, ...prev]);
      }

      setSuccess("Batch assigned to distributor successfully!");
      toast.success("Batch assigned successfully!");
      
      // Reset form
      setSelectedBatch("");
      setSelectedDistributor("");
      setQuantity("");
      setRemarks("");
      
      // Fetch updated assignments to get tracking info
      const res = await apiClient.get("/assignments/recent-assignments");
      setRecentAssignments(res.data.assignments || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign batch.");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen space-y-8">
      {/* <div className="w-full max-w-3xl p-6 bg-white border border-gray-200 shadow rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Package className="w-5 h-5 text-blue-600" /> Recently Assigned
            Batches
          </h3>
          <Link
            to="/manufacturer/assigned-batches"
            className="flex items-center text-sm text-blue-600 hover:text-blue-700"
          >
            View All
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
        <RecentAssignments assignments={recentAssignments} />
      </div> */}

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
          <div className="space-y-6 animate-pulse">
            {/* Batch Selection Skeleton */}
            <div>
              <div className="w-24 h-5 mb-2 bg-gray-200 rounded"></div>
              <div className="w-full h-10 bg-gray-200 rounded-lg"></div>
            </div>

            {/* Distributor Selection Skeleton */}
            <div>
              <div className="w-32 h-5 mb-2 bg-gray-200 rounded"></div>
              <div className="w-full h-10 bg-gray-200 rounded-lg"></div>
            </div>

            {/* Quantity Input Skeleton */}
            <div>
              <div className="w-16 h-5 mb-2 bg-gray-200 rounded"></div>
              <div className="w-full h-10 bg-gray-200 rounded-lg"></div>
            </div>

            {/* Remarks Textarea Skeleton */}
            <div>
              <div className="w-20 h-5 mb-2 bg-gray-200 rounded"></div>
              <div className="w-full h-24 bg-gray-200 rounded-lg"></div>
            </div>

            {/* Submit Button Skeleton */}
            <div className="w-full h-12 bg-gray-200 rounded-lg"></div>
          </div>
        ) : (
          <form onSubmit={handleAssign} className="space-y-6">
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Select Target Regions
              </label>
              <MultiSelect
                options={districts}
                value={selectedRegions}
                onChange={setSelectedRegions}
                placeholder="Select regions to find distributors"
                searchable={true}
                maxDisplayItems={3}
              />
              <p className="mt-1 text-sm text-gray-500">
                Select regions where you want to distribute this batch. Only distributors operating in these regions will be shown.
              </p>
            </div>
            
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
                    label: `${batch.batchNumber} (${batch.quantityRemainingForAssignment || batch.quantityProduced - (batch.quantityAssigned || 0)} remaining for assignment)`,
                  })),
                ]}
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Select Distributor
                {selectedRegions.length === 0 && (
                  <span className="ml-2 text-sm text-gray-500">(Select regions first)</span>
                )}
              </label>
              <Select
                value={selectedDistributor}
                onChange={setSelectedDistributor}
                disabled={selectedRegions.length === 0 || loadingDistributors}
                options={[
                  { 
                    value: "", 
                    label: selectedRegions.length === 0 
                      ? "-- Select regions first --"
                      : loadingDistributors 
                      ? "-- Loading distributors --"
                      : distributors.length === 0
                      ? "-- No distributors available in selected regions --"
                      : "-- Select Distributor --"
                  },
                  ...(distributors || []).map((dist) => ({
                    value: dist._id,
                    label: `${dist.companyName} - ${(dist.user?.workingRegions || []).join(', ')} (${dist.user?.address?.slice(0, 10)}...)`,
                  })),
                ]}
              />
              {selectedRegions.length > 0 && distributors.length > 0 && (
                <p className="mt-1 text-sm text-green-600">
                  Found {distributors.length} distributor{distributors.length !== 1 ? 's' : ''} in selected regions
                </p>
              )}
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
                assigning || !selectedBatch || !selectedDistributor || !quantity || selectedRegions.length === 0 || loadingDistributors
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
