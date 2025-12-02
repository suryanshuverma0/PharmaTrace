import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PackagePlus,
  CalendarDays,
  Building,
  Table2,
  Pill,
} from "lucide-react";
import Card from "../../components/UI/Card";
import Input from "../../components/UI/Input";
import Button from "../../components/UI/Button";
import Alert from "../../components/UI/Alert";
import QuantityExplanation from "../../components/UI/QuantityExplanation";
import apiClient from "../../services/api/api";
import { useNavigate, Link } from "react-router-dom";
import Select from "../../components/UI/Select";
import toast from "react-hot-toast";

const RegisterBatch = () => {
  const [formData, setFormData] = useState({
    batchNumber: "",
    manufactureDate: "",
    expiryDate: "",
    quantityProduced: "",
    dosageForm: "",
    strength: "",
    storageConditions: "",
    productionLocation: "",
    approvalCertId: "",
    productName: "",
    autoGenerateProducts: true // Keep for backend processing, hide from UI
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [batches, setBatches] = useState([]);
  const navigate = useNavigate();

  // Dosage form options
  const dosageFormOptions = [
    { value: "", label: "Select Dosage Form" },
    { value: "Tablet", label: "Tablet" },
    { value: "Capsule", label: "Capsule" },
    { value: "Injection", label: "Injection" },
    { value: "Syrup", label: "Syrup" },
    { value: "Cream", label: "Cream" },
    { value: "Other", label: "Other" },
  ];

  // Fetch registered batches on mount
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await apiClient.get("/batches");
        setBatches(response.data.batches || []);
      } catch (err) {
        setAlert({
          type: "error",
          title: "Failed to Load Batches",
          message:
            err.response?.data?.message ||
            "An error occurred while fetching batches.",
        });
      }
    };
    fetchBatches();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.batchNumber) {
      errors.push("Batch number is required.");
    } else if (!/^[A-Za-z0-9]+$/.test(formData.batchNumber)) {
      errors.push("Batch number must be alphanumeric.");
    }
    if (!formData.manufactureDate) {
      errors.push("Manufacture date is required.");
    }
    if (!formData.expiryDate) {
      errors.push("Expiry date is required.");
    }
    if (!formData.quantityProduced) {
      errors.push("Quantity produced is required.");
    } else if (
      isNaN(formData.quantityProduced) ||
      parseInt(formData.quantityProduced, 10) <= 0
    ) {
      errors.push("Quantity produced must be a positive integer.");
    }
    if (!formData.dosageForm) {
      errors.push("Dosage form is required.");
    }
    if (!formData.strength) {
      errors.push("Strength is required.");
    } else if (!/^\d+\s*(mg|g|ml)$/i.test(formData.strength)) {
      errors.push('Strength must be in format "number unit" (e.g., "500 mg").');
    }
    if (!formData.approvalCertId) {
      errors.push("Approval Certificate ID is required.");
    }
    if (!formData.storageConditions) {
      errors.push("Storage conditions are required.");
    } else if (!/(\d+)°?\s*c/i.test(formData.storageConditions)) {
      errors.push("Storage conditions should include temperature (e.g., 'Store below 25°C').");
    }
    if (!formData.productionLocation) {
      errors.push("Production location is required.");
    }
    if (!formData.productName) {
      errors.push("Product name is required.");
    }
    if (formData.manufactureDate && formData.expiryDate) {
      if (new Date(formData.expiryDate) <= new Date(formData.manufactureDate)) {
        errors.push("Expiry date must be after manufacture date.");
      }
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setAlert({
        type: "error",
        title: "Validation Error",
        message: validationErrors.join(" "),
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await apiClient.post("/batches/register", {
        batchNumber: formData.batchNumber,
        manufactureDate: formData.manufactureDate,
        expiryDate: formData.expiryDate,
        quantityProduced: parseInt(formData.quantityProduced, 10),
        dosageForm: formData.dosageForm,
        strength: formData.strength,
        storageConditions: formData.storageConditions,
        productionLocation: formData.productionLocation,
        approvalCertId: formData.approvalCertId,
        productName: formData.productName,
      });

      if (response.status === 201) {
        const message = formData.autoGenerateProducts 
          ? `Batch ${formData.batchNumber} registered successfully! Products will be auto-generated in the background.`
          : `Batch ${formData.batchNumber} registered successfully!`;
          
        setAlert({
          type: "success",
          title: "Batch Registered",
          message: message,
        });
        toast.success(message);
        navigate("/manufacturer/registered-batches");
        setFormData({
          batchNumber: "",
          manufactureDate: "",
          expiryDate: "",
          quantityProduced: "",
          dosageForm: "",
          strength: "",
          storageConditions: "",
          productionLocation: "",
          approvalCertId: "",
          productName: "",
          autoGenerateProducts: true
        });
        // Refresh batches
        const batchesResponse = await apiClient.get("/batches");
        setBatches(batchesResponse.data.batches || []);
        // Auto-dismiss success alert after 5 seconds
        setTimeout(() => setAlert(null), 5000);
      }
    } catch (err) {
      let errorMessage = "An error occurred while registering the batch.";
      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = err.response.data.message || "Invalid batch data.";
        } else if (err.response.status === 401) {
          errorMessage = "Authentication failed. Please log in again.";
          navigate("/login");
        } else {
          errorMessage = err.response.data.message || errorMessage;
        }
      } else {
        errorMessage = err.message || errorMessage;
      }
      setAlert({
        type: "error",
        title: "Registration Failed",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900">Register New Batch</h1>
        <p className="mt-3 text-lg text-gray-600">
          Add a new batch to the system for product registration
        </p>
      </motion.div>

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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-4xl mx-auto space-y-8"
      >
       

        {/* Batch Registration Form */}
        <Card className="overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Batch Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <PackagePlus className="w-5 h-5 text-primary-600" />
                <h3>Batch Information</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Input
                  label="Product Name"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Paracetamol"
                />
                <Input
                  label="Batch Number"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g., BN2025AA"
                  pattern="[A-Za-z0-9]+"
                  title="Batch number must be alphanumeric"
                />
                <Input
                  type="number"
                  label="Quantity Produced"
                  name="quantityProduced"
                  value={formData.quantityProduced}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="e.g., 1000"
                />
                <div>
            
                  <Select
                    label="Dosage Form"
                    name="dosageForm"
                    value={formData.dosageForm}
                    onChange={(value) =>
                      handleChange({ target: { name: "dosageForm", value } })
                    }
                    options={dosageFormOptions}
                    required
                    placeholder="Select Dosage Form"
               
                  />
                </div>
                <Input
                  label="Strength"
                  name="strength"
                  value={formData.strength}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 500 mg"
                  pattern="\d+\s*(mg|g|ml)"
                  title="Strength must be in format 'number unit' (e.g., '500 mg')"
                />
              </div>
            </div>

            {/* Manufacturing Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <CalendarDays className="w-5 h-5 text-primary-600" />
                <h3>Manufacturing Details</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Input
                  type="date"
                  label="Manufacture Date"
                  name="manufactureDate"
                  value={formData.manufactureDate}
                  onChange={handleChange}
                  required
                  max={new Date().toISOString().split("T")[0]}
                />
                <Input
                  type="date"
                  label="Expiry Date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  required
                  min={
                    formData.manufactureDate ||
                    new Date().toISOString().split("T")[0]
                  }
                />
                <Input
                  label="Approval Certificate ID"
                  name="approvalCertId"
                  value={formData.approvalCertId}
                  onChange={handleChange}
                  required
                  placeholder="e.g., CERT123"
                />
              </div>
            </div>

            {/* Storage and Location */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Building className="w-5 h-5 text-primary-600" />
                <h3>Storage and Location</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Input
                  label="Storage Conditions"
                  name="storageConditions"
                  value={formData.storageConditions}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Store below 25°C"
                  title="Include temperature information for proper environmental tracking"
                />
                <Input
                  label="Production Location"
                  name="productionLocation"
                  value={formData.productionLocation}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Kathmandu, Nepal"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registering..." : "Register Batch"}
              </Button>
            </div>
          </form>
        </Card>
         {/* Registered Batches Table */}
        {batches.length > 0 && (
          <Card className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between gap-2 mb-6 text-lg font-semibold text-gray-900">
                <div className="flex items-center gap-2">
                  <Table2 className="w-5 h-5 text-primary-600" />
                  <h3>Recent Batches</h3>
                </div>
                <Link
                  to="/manufacturer/registered-batches"
                  className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                >
                  View All ({batches.length})
                </Link>
              </div>
              
              <QuantityExplanation />
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">Batch Number</th>
                      <th className="px-6 py-3">Dosage Form</th>
                      <th className="px-6 py-3">Strength</th>
                      <th className="px-6 py-3">Manufacture Date</th>
                      <th className="px-6 py-3">Expiry Date</th>
                      <th className="px-6 py-3">Produced</th>
                      <th className="px-6 py-3">Products Reg.</th>
                      <th className="px-6 py-3">Assigned</th>
                      <th className="px-6 py-3">Remaining</th>
                      <th className="px-6 py-3">Approval Cert.</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.slice(0, 5).map((batch) => (
                      <tr
                        key={batch._id}
                        className="bg-white border-b hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {batch.batchNumber}
                        </td>
                        <td className="px-6 py-4">{batch.dosageForm || "-"}</td>
                        <td className="px-6 py-4">{batch.strength || "-"}</td>
                        <td className="px-6 py-4">
                          {new Date(batch.manufactureDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {new Date(batch.expiryDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {batch.quantityProduced}
                        </td>
                        <td className="px-6 py-4 text-blue-600">
                          {batch.totalProductsRegistered || (batch.quantityProduced - batch.quantityAvailable)}
                        </td>
                        <td className="px-6 py-4 text-orange-600">
                          {batch.quantityAssigned || 0}
                        </td>
                        <td className="px-6 py-4 font-medium text-green-600">
                          {batch.quantityRemainingForAssignment || (batch.quantityProduced - (batch.quantityAssigned || 0))}
                        </td>
                        <td className="px-6 py-4">
                          {batch.approvalCertId || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold
                            ${batch.shipmentStatus === 'Produced' ? 'bg-blue-100 text-blue-800' :
                              batch.shipmentStatus === 'In Transit' ? 'bg-amber-100 text-amber-800' :
                                batch.shipmentStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                                  batch.shipmentStatus === 'Returned' ? 'bg-red-100 text-red-800' :
                                    batch.shipmentStatus === 'Recalled' ? 'bg-gray-200 text-gray-800' :
                                      'bg-gray-100 text-gray-800'}`}
                          >
                            <span className="inline-block w-2 h-2 rounded-full"
                              style={{
                                backgroundColor:
                                  batch.shipmentStatus === 'Produced' ? '#2563eb' :
                                    batch.shipmentStatus === 'In Transit' ? '#f59e42' :
                                      batch.shipmentStatus === 'Delivered' ? '#059669' :
                                        batch.shipmentStatus === 'Returned' ? '#dc2626' :
                                          batch.shipmentStatus === 'Recalled' ? '#6b7280' :
                                            '#a3a3a3'
                              }}
                            />
                            {batch.shipmentStatus || 'Produced'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {batches.length > 5 && (
                  <div className="p-4 text-center border-t bg-gray-50">
                    <p className="text-sm text-gray-600">
                      Showing {Math.min(5, batches.length)} of {batches.length} batches. 
                      <Link 
                        to="/manufacturer/registered-batches"
                        className="ml-1 font-medium text-blue-600 hover:text-blue-700"
                      >
                        View all batches
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default RegisterBatch;
